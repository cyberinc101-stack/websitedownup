import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PushServiceWorker from "@/components/PushServiceWorker";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { SITE_NAME, SITE_URL, ADSENSE_PUBLISHER_ID } from "@/lib/config/site";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "Check whether any website is down for everyone or just for you. Live, real-time reachability checks with response times for popular sites.",
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {ADSENSE_PUBLISHER_ID && (
          <script
            async
            src={"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-" + ADSENSE_PUBLISHER_ID}
            crossOrigin="anonymous"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="font-body bg-bg text-ink antialiased min-h-screen flex flex-col">
        <GoogleAnalytics />
        <Header />
        <PushServiceWorker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}