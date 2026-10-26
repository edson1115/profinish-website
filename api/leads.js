const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");
const { rateLimited, fromOurSite } = require("./_guard");

// Where new leads are emailed. Override in Vercel > Settings > Environment Variables.
const NOTIFY_TO = process.env.LEAD_NOTIFY_TO || "profi@goprofinish.com";
// Sender. Resend only delivers from its test sender (onboarding@resend.dev) to the
// account owner's own inbox, so set LEAD_FROM_EMAIL to an address on goprofinish.com
// once the domain is verified at resend.com/domains.
const FROM = process.env.LEAD_FROM_EMAIL || "ProFinish Leads <onboarding@resend.dev>";
// If the main send fails (for example before the domain is verified), the lead is
// emailed here instead so it is never lost. Set LEAD_FALLBACK_TO to "" to disable.
const FALLBACK_TO =
  process.env.LEAD_FALLBACK_TO !== undefined ? process.env.LEAD_FALLBACK_TO : "edson.bigotires@gmail.com";
const ZAPIER_WEBHOOK_URL =
  process.env.ZAPIER_WEBHOOK_URL !== undefined
    ? process.env.ZAPIER_WEBHOOK_URL
    : "https://hooks.zapier.com/hooks/catch/26865650/uph4mob/";

// The only tables and fields this public endpoint may write. Anything else in
// the request is dropped. Numbers are max string lengths.
const SCHEMAS = {
  leads: {
    label: "Quote request",
    nameField: "customer_name",
    emailField: "customer_email",
    phoneField: "customer_phone",
    status: "NEW",
    fields: {
      customer_name: 120,
      customer_email: 200,
      customer_phone: 40,
      service_needed: 60,
      vin: 17,
      license_plate: 20,
      vehicle_info: 200,
      message: 3000,
    },
  },
  fleet_tech_leads: {
    label: "Fleet tech request",
    nameField: "contact_name",
    emailField: "email",
    phoneField: "phone",
    status: "new",
    fields: {
      company_name: 160,
      contact_name: 120,
      title: 120,
      phone: 40,
      email: 200,
      equipment_type: 120,
      telematics_provider: 120,
      hardware_purchased: 200,
      install_window: 120,
      notes: 3000,
    },
    integers: { unit_count: [0, 100000] },
  },
};

const LABELS = {
  customer_name: "Name",
  customer_email: "Email",
  customer_phone: "Phone",
  service_needed: "Service",
  vin: "VIN",
  license_plate: "Plate",
  vehicle_info: "Vehicle",
  message: "Notes",
  company_name: "Company",
  contact_name: "Contact",
  title: "Title",
  phone: "Phone",
  email: "Email",
  unit_count: "Units",
  equipment_type: "Equipment",
  telematics_provider: "Telematics provider",
  hardware_purchased: "Hardware purchased",
  install_window: "Install window",
  notes: "Notes",
};

const SERVICE_NAMES = {
  glass: "Auto glass",
  pdr: "Paintless dent repair",
  wheel: "Wheel & rim repair",
  telematics: "Telematics & cameras",
  batteries: "Battery replacement",
  keys: "Keys & fobs",
  other: "Other / not sure",
};

let supabase = null;
function db() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return supabase;
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clean(raw, schema) {
  const out = {};
  for (const [key, max] of Object.entries(schema.fields)) {
    const v = raw[key];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "string" && typeof v !== "number") continue;
    out[key] = String(v).trim().slice(0, max);
  }
  for (const [key, [min, max]] of Object.entries(schema.integers || {})) {
    const n = parseInt(raw[key], 10);
    if (Number.isFinite(n) && n >= min && n <= max) out[key] = n;
  }
  return out;
}

function validate(data, schema) {
  const name = data[schema.nameField];
  const email = data[schema.emailField];
  const phone = data[schema.phoneField] || "";
  if (!name) return "Please enter your name.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Please enter a valid email address.";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return "Please enter a phone number with area code.";
  return null;
}

// Photos must be ones our own upload endpoint created in the damage-images bucket.
function cleanImageUrls(list) {
  if (!Array.isArray(list)) return [];
  const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const prefix = `${base}/storage/v1/object/public/damage-images/public/`;
  return list
    .filter((u) => typeof u === "string" && base && u.startsWith(prefix) && u.length < 400)
    .slice(0, 3);
}

function emailHtml(schema, data, images, dbErrorMessage) {
  const rows = Object.entries(data)
    .map(([k, v]) => [k, k === "service_needed" ? SERVICE_NAMES[v] || v : v])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#667;vertical-align:top;white-space:nowrap">${escapeHtml(
          LABELS[k] || k,
        )}</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const phone = data[schema.phoneField] || "";
  const pics = images.length
    ? `<p><b>Photos</b></p>${images
        .map((u) => `<p><a href="${escapeHtml(u)}"><img src="${escapeHtml(u)}" alt="Damage photo" style="max-width:320px;border-radius:8px"></a></p>`)
        .join("")}`
    : "";
  const warn = dbErrorMessage
    ? `<p style="background:#fff3cd;padding:10px;border-radius:6px"><b>Not saved to the database</b> (${escapeHtml(
        dbErrorMessage,
      )}). This email is the only record of this lead. Follow up directly.</p>`
    : "";
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
  <h2 style="margin:0 0 4px">${escapeHtml(schema.label)}</h2>
  <p style="margin:0 0 16px;color:#667">From goprofinish.com</p>
  ${warn}
  <table style="border-collapse:collapse">${rows}</table>
  ${phone ? `<p style="margin-top:16px"><a href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ""))}" style="background:#F26522;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Call ${escapeHtml(phone)}</a></p>` : ""}
  ${pics}
</div>`;
}

async function sendLeadEmail(schema, data, images, dbErrorMessage) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const who = data[schema.nameField] || "New lead";
  const what = SERVICE_NAMES[data.service_needed] || data.service_needed || data.company_name || "";
  const subject = `${dbErrorMessage ? "[ACTION NEEDED] " : ""}${schema.label}: ${who}${what ? ` (${what})` : ""}`;
  const message = {
    from: FROM,
    subject: subject.slice(0, 180),
    html: emailHtml(schema, data, images, dbErrorMessage),
    replyTo: data[schema.emailField],
  };

  const first = await resend.emails.send({ ...message, to: [NOTIFY_TO] });
  if (!first.error) return NOTIFY_TO;
  console.error("[leads] Email to", NOTIFY_TO, "failed:", first.error.message || first.error);

  if (FALLBACK_TO && FALLBACK_TO !== NOTIFY_TO) {
    const second = await resend.emails.send({ ...message, to: [FALLBACK_TO] });
    if (!second.error) return FALLBACK_TO;
    console.error("[leads] Fallback email failed:", second.error.message || second.error);
  }
  throw new Error("Lead email could not be delivered");
}

async function notifyZapier(payload) {
  if (!ZAPIER_WEBHOOK_URL) return;
  try {
    await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error("[leads] Zapier webhook failed:", err.message);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!fromOurSite(req)) {
    res.status(403).json({ ok: false, error: "Forbidden" });
    return;
  }
  if (rateLimited(req, 8)) {
    res.status(429).json({ ok: false, error: "Too many requests. Please call (830) 356-3456." });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { table, data: raw } = body;
  const schema = SCHEMAS[table];
  if (!schema || !raw || typeof raw !== "object") {
    res.status(400).json({ ok: false, error: "Invalid request" });
    return;
  }

  // Honeypot: real visitors never see or fill this field. Pretend success so bots move on.
  if (body.website || raw.website) {
    res.status(200).json({ ok: true });
    return;
  }

  const data = clean(raw, schema);
  const problem = validate(data, schema);
  if (problem) {
    res.status(400).json({ ok: false, error: problem });
    return;
  }

  const images = table === "leads" ? cleanImageUrls(raw.image_urls) : [];
  const row = { ...data, status: schema.status };
  if (table === "leads") row.image_urls = images;

  let savedTo = null;
  let dbErrorMessage = null;
  try {
    const client = db();
    if (!client) throw new Error("Database is not configured");
    const { error } = await client.from(table).insert([row]);
    if (error) throw error;
    savedTo = "database";
  } catch (err) {
    dbErrorMessage = err.message || String(err);
    console.error(`[leads] DB insert failed for "${table}":`, dbErrorMessage);
  }

  try {
    await sendLeadEmail(schema, data, images, dbErrorMessage);
    if (!savedTo) savedTo = "email";
  } catch (err) {
    console.error("[leads] Notification email failed:", err.message || err);
  }

  await notifyZapier({ ...row, source: table });

  if (!savedTo) {
    res.status(500).json({
      ok: false,
      error: "We couldn't send your request. Please call (830) 356-3456 or email profi@goprofinish.com.",
    });
    return;
  }
  res.status(200).json({ ok: true });
};
