export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const stripeKey = process.env.STRIPE_KEY;
  if (!stripeKey) return res.status(500).json({ error: "Stripe key not configured on server" });
  const body = req.body || {};
  const email = body.email || "";
  const isFounder = body.isFounder || false;
  const priceId = "price_1T723x2Kajb8iaSARAco5xzs";
  const founderCoupon = "FC4wAN6F";
  try {
    const params = new URLSearchParams();
    params.append("payment_method_types[]", "card");
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("subscription_data[trial_period_days]", "3");
    params.append("success_url", "https://apex-perform.vercel.app/?payment=success");
    params.append("cancel_url", "https://apex-perform.vercel.app/?payment=cancel");
    if (email) params.append("customer_email", email);
    if (isFounder) params.append("discounts[0][coupon]", founderCoupon);
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + stripeKey, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const session = await response.json();
    if (session.error) return res.status(400).json({ error: session.error.message, type: session.error.type });
    if (!session.url) return res.status(400).json({ error: "No URL returned", debug: JSON.stringify(session).slice(0, 200) });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: "Server: " + err.message });
  }
}
