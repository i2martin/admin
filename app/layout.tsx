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
