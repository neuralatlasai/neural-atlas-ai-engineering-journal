import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Libre_Franklin, Newsreader } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { absoluteUrl, site } from "@/lib/site";

// Subset, swap-loaded, and exposed as CSS variables (plan §7.3).
const franklin = Libre_Franklin({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-franklin",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  axes: ["opsz"],
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  // Includes the deployment base path, so any relative metadata URL resolves
  // under the sub-path the site is actually served from.
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.shortDescription,
  applicationName: site.name,
  authors: [{ name: site.publisher }],
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
    title: `${site.name} — ${site.tagline}`,
    description: site.shortDescription,
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.shortDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: {
    canonical: absoluteUrl("/"),
    types: { "application/rss+xml": [{ url: absoluteUrl("/feed.xml"), title: `${site.name} — all articles` }] },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

/**
 * `viewport-fit=cover` lets the shell's `env(safe-area-inset-*)` padding do its
 * job on notched displays. `themeColor` is declared per scheme so the browser
 * chrome matches the canvas in both themes.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f0c" },
  ],
};

/**
 * Applies the stored theme before first paint, so the page never flashes the
 * wrong scheme. It also records the *mode* (`system` | `light` | `dark`) so the
 * theme control can paint the right icon server-side (see `ThemeToggle`).
 */
const themeScript = `(function(){var r=document.documentElement;var m="system";try{var s=localStorage.getItem("na-theme");if(s==="dark"||s==="light")m=s;}catch(e){}r.setAttribute("data-theme-mode",m);if(m!=="system")r.setAttribute("data-theme",m);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={site.locale}
      suppressHydrationWarning
      className={`${franklin.variable} ${newsreader.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
