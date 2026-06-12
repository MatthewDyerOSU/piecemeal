import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Atkinson_Hyperlegible } from "next/font/google";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-mono",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "PieceMeal",
    template: "%s · PieceMeal",
  },
  description:
    "Save recipes and find what you can cook with the ingredients you have.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0e" },
  ],
};

// Applies a stored theme override before first paint to avoid a flash of
// the wrong theme. Kept inline so it runs before any rendering.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ibmPlexMono.variable} ${atkinson.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <NavBar />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <p>© {new Date().getFullYear()} Matt Dyer</p>
            <p>
              <Link href="/accessibility">Accessibility statement</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
