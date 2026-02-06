"use server";

import { prisma } from "@/lib/prisma";

type SaveRow = {
  id: string;
  distanceToWork: number | null;
  distanceFromWork: number | null;
  transport: string | null;
  included: boolean;
};

export async function saveTravelExpenses(rows: SaveRow[]) {
  // Simple + safe: update by ID (no fancy diffing)
  await prisma.$transaction(
    rows.map((r) =>
      prisma.travelExpense.update({
        where: { id: r.id },
        data: {
          distanceToWork: r.distanceToWork,
          distanceFromWork: r.distanceFromWork,
          transport: r.transport ?? null,
          included: r.included,
        },
      }),
    ),
  );

  return { ok: true };
}
