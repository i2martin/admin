"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";

export default function NavbarShell() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;
  return <Navbar />;
}
