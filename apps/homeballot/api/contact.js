// Contact form relay. The destination address lives only in the CONTACT_EMAIL
// environment variable on Vercel, so it never appears in the page or the repo.
// Delivery goes through FormSubmit's AJAX endpoint; the first message sent to a
// new address triggers a one-time activation email that must be confirmed.

const TOPICS = ["General question", "Press or media", "Partnership", "Volunteer or developer", "Other"];
const LIMITS = { name: 80, email: 120, message: 4000 };

function clean(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const to = process.env.CONTACT_EMAIL;
  if (!to) return res.status(503).json({ ok: false, error: "The contact form is not configured yet." });

  const body = await readBody(req);

  // Honeypot: real visitors never see or fill this field.
  if (body.website) return res.status(200).json({ ok: true });

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const message = clean(body.message, LIMITS.message);
  const topic = TOPICS.includes(body.topic) ? body.topic : "General question";

  if (!name) return res.status(400).json({ ok: false, error: "Please enter your name." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
  if (message.length < 10) return res.status(400).json({ ok: false, error: "Please enter a message of at least 10 characters." });

  const origin = `https://${req.headers["x-forwarded-host"] || req.headers.host || "homeballot.vercel.app"}`;
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Origin: origin, Referer: origin + "/" },
      body: JSON.stringify({
        _subject: `Homeballot inquiry: ${topic}`,
        _template: "table",
        _captcha: "false",
        _replyto: email,
        Name: name,
        Email: email,
        Topic: topic,
        Message: message,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || String(data.success) === "false") {
      console.error("contact relay failed", r.status, data && data.message);
      return res.status(502).json({ ok: false, error: "Your message could not be sent. Please try again later." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("contact relay error", err);
    return res.status(502).json({ ok: false, error: "Your message could not be sent. Please try again later." });
  }
};
