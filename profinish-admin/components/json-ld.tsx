export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoBodyShop",
    "name": "Profinish",
    "description": "Premium B2B dispatch network for collision repair, fleet upgrades, and high-tech vehicle integrations.",
    "url": "https://www.goprofinish.com",
    "telephone": "+1-800-555-0199",
    "areaServed": "US",
    "knowsAbout": [
      "Fleet Upgrades",
      "Telematics",
      "Collision Repair",
      "Dash Cameras",
      "Battery Systems"
    ],
    "brand": {
      "@type": "Brand",
      "name": "Profinish"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}