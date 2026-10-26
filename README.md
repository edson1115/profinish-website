# goprofinish.com

Static site for ProFinish Elite Glass & Keys, hosted on Vercel. Pages are plain HTML with Tailwind from the CDN; form handling runs as Vercel functions in `api/`.

## Editing the header, footer or contact details

The header, mobile menu, call bar, footer and shared `<head>` tags (canonical URL, social tags, business schema) are the same on every page. Edit them once in `partials/`, then run:

```bash
python3 scripts/sync_layout.py
```

That rewrites the blocks between the `PF:HEAD`, `PF:HEADER` and `PF:FOOTER` markers on every `.html` page. Page content outside the markers is never touched.

Shared styles and behavior live in `assets/site.css` and `assets/site.js`. The quote form logic is `assets/quote-form.js`.

## Forms

- `api/leads.js` saves quote and fleet tech requests to Supabase and emails them. Only listed fields are accepted, inputs are length-limited and escaped, and a hidden honeypot field filters bots.
- `api/upload-url.js` gives the quote form one-time signed upload URLs for damage photos.

### Vercel environment variables

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key used by the API functions |
| `RESEND_API_KEY` | Resend key for lead emails |
| `LEAD_NOTIFY_TO` | Where leads are emailed. Defaults to profi@goprofinish.com |
| `LEAD_FROM_EMAIL` | Sender, e.g. `ProFinish Leads <leads@goprofinish.com>` once the domain is verified in Resend |
| `LEAD_FALLBACK_TO` | Backup inbox used if the main send fails. Set to an empty value to turn off |
| `ZAPIER_WEBHOOK_URL` | Optional Zapier hook for real-time alerts |

## Local preview

```bash
npm install
node serve.mjs   # http://localhost:3000 (forms need `vercel dev` to reach the API)
```

## SEO

- `sitemap.xml` and `robots.txt` use https://www.goprofinish.com. Add new pages to the sitemap.
- `vercel.json` sets security headers and caching.
- `.vercelignore` keeps source folders, notes and the nested admin app from being served publicly.
