import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return <div className="p-6">Not authenticated</div>;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { settings: true },
  });
  if (!user) return <div className="p-6">User not found</div>;

  const s = user.settings;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <SettingsForm
        initial={{
          fullName: s?.fullName ?? "",
          homeAddress: s?.homeAddress ?? "",
          workAddress: s?.workAddress ?? "",
          // Prisma Decimal -> use String for safe transport to client
          distanceToWork: s?.distanceToWork?.toString() ?? "",
          distanceFromWork: s?.distanceFromWork?.toString() ?? "",
          pricePerKm: s?.pricePerKm?.toString() ?? "",
          defaultTransport: s?.defaultTransport ?? "car",
        }}
      />
    </main>
  );
}
