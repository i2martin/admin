"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/travel-expenses", label: "Putni troškovi" },
  { href: "/extra-hours", label: "Prekovremeni sati" },
  { href: "/settings", label: "Postavke" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="font-semibold">
          Naslovna
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "px-3 py-2 rounded-xl text-sm",
                  active
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-3 py-2 rounded-xl text-sm border hover:bg-gray-50"
        >
          Odjava
        </button>
      </div>
    </header>
  ); //
}
