import type { Metadata } from "next";
import { requireRole } from "@/server/session";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import type { NavItem } from "@/components/app/workspace-nav";

export const metadata: Metadata = {
  title: { default: "Logistics portal", template: "%s · Logistics | Lelam" },
  robots: { index: false, follow: false },
};

export default async function LogisticsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["logistics", "admin"], "/logistics");
  const items: NavItem[] = [
    { href: "/logistics", label: "Dashboard", icon: "overview", exact: true },
    { href: "/logistics/requests", label: "Requests & quotes", icon: "requests" },
    { href: "/logistics/profile", label: "Company profile", icon: "profile" },
  ];
  const secondary: NavItem[] = [{ href: "/dashboard/notifications", label: "Notifications", icon: "notifications" }];
  if (user.role === "admin") secondary.push({ href: "/admin", label: "Admin console", icon: "admin" });
  return (
    <WorkspaceShell section="Logistics portal" user={user} items={items} secondary={secondary}>
      {children}
    </WorkspaceShell>
  );
}
