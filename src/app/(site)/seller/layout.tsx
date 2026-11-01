import type { Metadata } from "next";
import { requireRole } from "@/server/session";
import { WorkspaceShell } from "@/components/app/workspace-shell";
import type { NavItem } from "@/components/app/workspace-nav";

export const metadata: Metadata = {
  title: { default: "Seller portal", template: "%s · Seller | Lelam" },
  robots: { index: false, follow: false },
};

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["seller", "admin"], "/seller");
  const items: NavItem[] = [
    { href: "/seller", label: "Overview", icon: "overview", exact: true },
    { href: "/seller/auctions", label: "My listings", icon: "list" },
    { href: "/seller/auctions/create", label: "Create listing", icon: "create" },
  ];
  const secondary: NavItem[] = [{ href: "/dashboard", label: "Buyer dashboard", icon: "overview", exact: true }];
  if (user.role === "admin") secondary.push({ href: "/admin", label: "Admin console", icon: "admin" });
  return (
    <WorkspaceShell section="Seller portal" user={user} items={items} secondary={secondary}>
      {children}
    </WorkspaceShell>
  );
}
