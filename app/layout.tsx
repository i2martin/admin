import "./globals.css";
import type { Metadata } from "next";
import Providers from "./providers";
import NavbarShell from "@/components/navbar-shell";

export const metadata: Metadata = {
  title: "Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols Outlined */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
        />

        {/* Inter (optional if you already load via next/font) */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />

        {/* This matches your original icon settings */}
        <style>{`
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}</style>
      </head>
      <body>
        <Providers>
          {/* Navbar reads the current route and will show on all pages.
              If you want to hide it on /login, use the optional step below. */}
          <NavbarShell />
          <div className="mx-auto max-w-6xl">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
