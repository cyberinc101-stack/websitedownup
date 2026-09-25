import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PushServiceWorker from "@/components/PushServiceWorker";
import { SITE_NAME, SITE_URL } from "@/lib/config/site";

export const metadata: Metadata = {
  title: SITE_NAME + " \u2014 Is it down right now?",
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
      <body className="font-body bg-bg text-ink antialiased min-h-screen flex flex-col">
        <Header />
        <PushServiceWorker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
