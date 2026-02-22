import { SessionProvider } from "next-auth/react";
import { SidebarProvider, SidebarInset } from "@/shared/ui/sidebar";
import { AppSidebar } from "@/widgets/app-sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
