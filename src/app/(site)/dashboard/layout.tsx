import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { hasFeature } from "@/server/workspace";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import type { NavItem } from "@/components/app/workspace-nav";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard | Lelam" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const unread = await read((db) => db.notifications.filter((n) => n.userId === user.id && !n.read).length);

  const items: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: "overview", exact: true },
    { href: "/dashboard/interested", label: "Watchlist", icon: "watchlist" },
    { href: "/dashboard/bids", label: "My bids", icon: "bids" },
    { href: "/dashboard/reminders", label: "Reminders", icon: "reminders", locked: !hasFeature(user, "reminders") },
    { href: "/dashboard/documents", label: "Documents", icon: "documents", locked: !hasFeature(user, "documents") },
    { href: "/dashboard/inventory", label: "Inventory", icon: "inventory", locked: !hasFeature(user, "inventory") },
    { href: "/dashboard/vendors", label: "Vendors", icon: "vendors", locked: !hasFeature(user, "inventory") },
    { href: "/dashboard/quotes", label: "Quotes", icon: "quotes", locked: !hasFeature(user, "quoteBuilder") },
    { href: "/dashboard/shipping-requests", label: "Shipping requests", icon: "shipping", locked: !hasFeature(user, "logisticsQuotes") },
    { href: "/dashboard/notifications", label: "Notifications", icon: "notifications", badge: unread },
    { href: "/dashboard/profile", label: "Profile", icon: "profile" },
  ];

  const secondary: NavItem[] = [];
  if (user.role === "seller" || user.role === "admin") secondary.push({ href: "/seller", label: "Seller portal", icon: "seller" });
  if (user.role === "logistics" || user.role === "admin") secondary.push({ href: "/logistics", label: "Logistics portal", icon: "logistics" });
  if (user.role === "admin") secondary.push({ href: "/admin", label: "Admin console", icon: "admin" });

  return (
    <WorkspaceShell section="Dashboard" user={user} items={items} secondary={secondary}>
      {children}
    </WorkspaceShell>
  );
}
