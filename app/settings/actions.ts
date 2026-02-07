"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function parseDecimal(input: string): Prisma.Decimal | null {
  const t = input.trim();
  if (!t) return null;

  // allow "12,5" or "12.5"
  const normalized = t.replace(",", ".");
  const n = Number(normalized);

  if (!Number.isFinite(n)) return null;

  // keep as typed precision; store as Decimal
  return new Prisma.Decimal(normalized);
}

export async function saveSettings(form: {
  fullName: string;
  homeAddress: string;
  workAddress: string;
  distanceToWork: string; // decimal text
  distanceFromWork: string; // decimal text
  pricePerKm: string; // decimal text
  defaultTransport: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) throw new Error("Unauthorized");

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {
      fullName: form.fullName.trim() || null,
      homeAddress: form.homeAddress.trim() || null,
      workAddress: form.workAddress.trim() || null,
      distanceToWork: parseDecimal(form.distanceToWork),
      distanceFromWork: parseDecimal(form.distanceFromWork),
      pricePerKm: parseDecimal(form.pricePerKm),
      defaultTransport: form.defaultTransport || "osobni automobil",
    },
    create: {
      userId: user.id,
      fullName: form.fullName.trim() || null,
      homeAddress: form.homeAddress.trim() || null,
      workAddress: form.workAddress.trim() || null,
      distanceToWork: parseDecimal(form.distanceToWork),
      distanceFromWork: parseDecimal(form.distanceFromWork),
      pricePerKm: parseDecimal(form.pricePerKm),
      defaultTransport: form.defaultTransport || "osobni automobil",
    },
  });

  return { ok: true };
}
