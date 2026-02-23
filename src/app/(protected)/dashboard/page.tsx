import { headers } from "next/headers";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-muted-foreground mt-2">
        환영합니다, {session?.user?.name ?? "사용자"}님!
      </p>
    </div>
  );
}
