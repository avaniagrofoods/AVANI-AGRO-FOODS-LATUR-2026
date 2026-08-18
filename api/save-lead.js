// Vercel Serverless Function for AVANI AGRO FOODS
// Lead capture & WhatsApp notification handler

export default async function handler(req, res) {
  // 1. Method Validation
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  try {
    const body = req.body || {};
    const { name, phone, inquiry, source } = body;

    // 2. Input Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const PICKY_ASSIST_URL = "https://app.pickyassist.com/url/5cb2564f744736ff1b4d09e1ebad26748625043e";
    
    const leadData = {
      name: name.trim().slice(0, 120),
      phone: phone.trim().slice(0, 30),
      inquiry: (inquiry || '').toString().slice(0, 500),
      businessName: "AVANI AGRO FOODS",
      type: "B2B Export & Manufacturing",
      location: "Latur, Maharashtra",
      website: "https://www.avaniagrofoods.com",
      id: Date.now(),
      timestamp: new Date().toISOString(),
      source: (source || 'Agro_Website_Form').toString().slice(0, 50)
    };

    // 3. Dispatch to Picky Assist (WhatsApp Automation)
    try {
      await fetch(PICKY_ASSIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
    } catch (webhookErr) {
      // Non-blocking catch to ensure client receives lead confirmation
      console.error('Webhook notification failed:', webhookErr.message);
    }

    return res.status(200).json({ success: true, message: "Lead captured successfully" });

  } catch (error) {
    // Safe error message without exposing internal stack traces
    return res.status(500).json({ success: false, error: "An unexpected error occurred. Please try again." });
  }
}
