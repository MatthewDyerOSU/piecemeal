import type { Metadata, Viewport } from "next";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import "./globals.css";

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
    { media: "(prefers-color-scheme: dark)", color: "#101418" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
            <p>
              <Link href="/accessibility">Accessibility statement</Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
