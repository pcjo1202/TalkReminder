import Link from "next/link";
import {
  LayoutDashboard,
  Bell,
  Plug,
  FileText,
  ScrollText,
} from "lucide-react";
import { auth } from "@/auth";
import { UserMenu } from "@/features/auth-actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";

const navItems = [
  { title: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { title: "알람", href: "/reminders/new", icon: Bell },
  { title: "채널", href: "/channels", icon: Plug },
  { title: "템플릿", href: "/templates", icon: FileText },
  { title: "로그", href: "/logs", icon: ScrollText },
];

export async function AppSidebar() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="text-lg font-bold">
          Talk Reminder
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <UserMenu
          name={session.user.name ?? null}
          email={session.user.email!}
          image={session.user.image ?? null}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
