const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

// Only these tables may be written to via this public endpoint.
const ALLOWED_TABLES = new Set(["leads", "fleet_tech_leads"]);

// NOTE: Resend is currently in sandbox mode on this account, which can only
// deliver to the account owner's own address. Once a sending domain is
// verified at resend.com/domains, switch this to profi@goprofinish.com (and
// update `from` to use that domain).
const FALLBACK_TO = "edson.bigotires@gmail.com";
const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/26865650/uph4mob/";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { table, data } = req.body || {};

  if (!ALLOWED_TABLES.has(table) || !data || typeof data !== "object") {
    res.status(400).json({ ok: false, error: "Invalid request" });
    return;
  }

  let savedTo = null;

  try {
    const { error } = await supabase.from(table).insert([data]);
    if (error) throw error;
    savedTo = "database";
  } catch (dbErr) {
    console.error(`[leads] DB insert failed for table "${table}":`, dbErr.message);

    // Database write failed (paused project, RLS misconfig, outage, etc).
    // Fall back to emailing the raw lead so it isn't lost.
    try {
      const { error: resendError } = await resend.emails.send({
        from: "ProFinish Leads <onboarding@resend.dev>",
        to: [FALLBACK_TO],
        subject: `[ACTION NEEDED] Lead capture DB write failed (${table})`,
        html: `<p>A new lead came in but could not be saved to the database. Please follow up with the customer directly and enter this lead manually once the database issue is resolved.</p>
<pre style="background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-wrap;">${JSON.stringify(data, null, 2)}</pre>
<p>DB error: ${dbErr.message}</p>`,
      });
      // The Resend SDK returns { error } on failure rather than throwing -
      // without this check a failed send would be reported as a success.
      if (resendError) throw resendError;
      savedTo = "email_fallback";
    } catch (emailErr) {
      console.error("[leads] Fallback email also failed:", emailErr.message || emailErr);
    }
  }

  // Best-effort real-time alert; never blocks the response either way.
  fetch(ZAPIER_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, source: table }),
  }).catch((err) => console.error("[leads] Zapier webhook failed:", err.message));

  if (!savedTo) {
    res.status(500).json({
      ok: false,
      error: "Failed to save lead through any channel. Please call or email us directly.",
    });
    return;
  }

  res.status(200).json({ ok: true, savedTo });
};
