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

/**
 * Static demo mode (GitHub Pages build). Server features — sign-in, dashboards, checkout,
 * saved data — aren't available; the UI explains that instead of erroring.
 */
export const STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
export const DEMO_FORM_MESSAGE = `This is a static demo, so forms don't send. Email ${SUPPORT.email} instead.`;
