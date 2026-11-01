export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lelam.co").replace(/\/$/, "");

export const SUPPORT = {
  email: "support@lelam.co",
  businessEmail: "business@lelam.co",
  phone: "+91 94477 53889",
  hours: "Mon–Sat, 9:00–18:00 IST",
  address: ["No. 2, 20th Cross, Lakshmipuram", "Halasuru, Bengaluru 560008"],
};

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
