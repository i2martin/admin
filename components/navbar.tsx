"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/travel-expenses", label: "Travel expenses" },
  { href: "/honorariums", label: "Honorariums" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link href="/travel-expenses" className="font-semibold">
          Admin
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
          Sign out
        </button>
      </div>
    </header>
  );
}
