// Issues one-time signed upload URLs for quote-form damage photos, so the
// storage bucket no longer needs to accept anonymous uploads from anyone.
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { rateLimited, fromOurSite } = require("./_guard");

const BUCKET = "damage-images";
const MAX_FILES = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

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
  if (rateLimited(req, 10)) {
    res.status(429).json({ ok: false, error: "Too many uploads. Please try again later." });
    return;
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(503).json({ ok: false, error: "Photo uploads are not configured" });
    return;
  }

  const files = Array.isArray(req.body?.files) ? req.body.files.slice(0, MAX_FILES) : [];
  if (!files.length) {
    res.status(400).json({ ok: false, error: "No files" });
    return;
  }
  for (const f of files) {
    if (!f || !TYPES[f.type]) {
      res.status(400).json({ ok: false, error: "Photos must be JPG, PNG, WEBP or HEIC." });
      return;
    }
    if (!(f.size > 0 && f.size <= MAX_BYTES)) {
      res.status(400).json({ ok: false, error: "Each photo must be 10 MB or smaller." });
      return;
    }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const uploads = [];
  for (const f of files) {
    const path = `public/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${TYPES[f.type]}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) {
      console.error("[upload-url] signed URL failed:", error.message);
      res.status(500).json({ ok: false, error: "Could not prepare the upload" });
      return;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    uploads.push({ path, token: data.token, publicUrl: pub.publicUrl });
  }
  res.status(200).json({ ok: true, bucket: BUCKET, uploads });
};
