import {
  Boxes,
  Building2,
  Car,
  Cpu,
  Factory,
  Gem,
  Trees,
  BookOpen,
  Newspaper,
  LifeBuoy,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "@/lib/types";

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  scrap: Boxes,
  machinery: Factory,
  vehicles: Car,
  "real-estate": Building2,
  "e-waste": Cpu,
  minerals: Gem,
  forest: Trees,
};

export const RESOURCES: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  { href: "/blog", label: "Insights", description: "Guides on costs, compliance and strategy", icon: BookOpen },
  { href: "/news", label: "Bulletin", description: "Platform updates and explainers", icon: Newspaper },
  { href: "/faq", label: "Help centre", description: "Answers on bidding, EMD and plans", icon: LifeBuoy },
  { href: "/notices", label: "Notices", description: "Official announcements from Lelam", icon: Megaphone },
];

export const QUICK_SEARCHES = [
  { label: "Copper scrap", q: "copper scrap" },
  { label: "Vehicles near me", q: "vehicles near me" },
  { label: "Bank property in Chennai", q: "property in Chennai" },
  { label: "Re-auctioned lots", q: "re-auctioned" },
];

export const FOOTER_GROUPS = [
  {
    title: "Marketplace",
    links: [
      { href: "/auctions", label: "All auctions" },
      { href: "/auctions?source=MSTC", label: "MSTC catalogs" },
      { href: "/auctions?source=BaankNet", label: "Bank properties" },
      { href: "/auctions?status=live", label: "Live now" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/quotes", label: "Quote Builder" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/seller", label: "Seller portal" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Insights" },
      { href: "/news", label: "Bulletin" },
      { href: "/faq", label: "Help centre" },
      { href: "/notices", label: "Notices" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];
