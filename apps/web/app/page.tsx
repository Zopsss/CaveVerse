import { prisma } from "@repo/db";

export default async function Page() {
  const user = await prisma.user.findFirst();
  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-24">
      {user?.username ?? "No user added yet"}
    </main>
  );
}
