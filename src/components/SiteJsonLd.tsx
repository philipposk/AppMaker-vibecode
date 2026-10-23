/** Site-wide structured data (WebSite, Organization, SoftwareApplication) for search engines. */
const SITE_URL = "https://appmaker.6x7.gr";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "AppMaker",
      description: "Describe a web app and get working HTML, CSS and JavaScript in seconds.",
      publisher: { "@id": "https://6x7.gr/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": "https://6x7.gr/#organization",
      name: "6x7",
      url: "https://6x7.gr",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "AppMaker",
      url: SITE_URL,
      description: "Describe a web app and get working HTML, CSS and JavaScript in seconds.",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      publisher: { "@id": "https://6x7.gr/#organization" },
    },
  ],
};

export function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      // Escape "<" so the JSON can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
