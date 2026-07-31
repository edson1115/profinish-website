const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

// Only these tables may be written to via this public endpoint.
const ALLOWED_TABLES = new Set(["leads", "fleet_tech_leads"]);

// NOTE: Resend is currently in sandbox mode on this account, which can only
// deliver to the account owner's own address. Once a sending domain is
// verified at resend.com/domains, switch this to profi@goprofinish.com (and
// update `from` to use that domain).
const NOTIFY_TO = "edson.bigotires@gmail.com";
const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/26865650/uph4mob/";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const resend = new Resend(process.env.RESEND_API_KEY);

function labelFor(data) {
  return data.customer_name || data.contact_name || data.company_name || "New lead";
}

async function sendLeadEmail({ subject, intro, data, dbErrorMessage }) {
  const { error } = await resend.emails.send({
    from: "ProFinish Leads <onboarding@resend.dev>",
    to: [NOTIFY_TO],
    subject,
    html: `<p>${intro}</p>
<pre style="background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-wrap;">${JSON.stringify(data, null, 2)}</pre>
${dbErrorMessage ? `<p>DB error: ${dbErrorMessage}</p>` : ""}`,
  });
  // The Resend SDK returns { error } on failure rather than throwing -
  // without this check a failed send would be silently reported as success.
  if (error) throw error;
}

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
  let dbErrorMessage = null;

  try {
    const { error } = await supabase.from(table).insert([data]);
    if (error) throw error;
    savedTo = "database";
  } catch (dbErr) {
    dbErrorMessage = dbErr.message;
    console.error(`[leads] DB insert failed for table "${table}":`, dbErr.message);
  }

  // Always email a notification. When the DB write succeeded this is just a
  // heads-up; when it failed, this email IS the record of the lead, so its
  // success or failure determines whether we can still call this a save.
  try {
    await sendLeadEmail({
      subject: savedTo
        ? `New lead: ${labelFor(data)}`
        : `[ACTION NEEDED] Lead capture DB write failed (${table})`,
      intro: savedTo
        ? "A new lead was just submitted and saved to the database."
        : "A new lead came in but could not be saved to the database. Please follow up with the customer directly and enter this lead manually once the database issue is resolved.",
      data,
      dbErrorMessage,
    });
    if (!savedTo) savedTo = "email_fallback";
  } catch (emailErr) {
    console.error("[leads] Notification email failed:", emailErr.message || emailErr);
    // If the DB save already succeeded, a failed notification is non-fatal -
    // the lead is safe, we just didn't get pinged about it.
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
