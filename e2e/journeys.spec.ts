import { expect, test, type Page } from "@playwright/test";

async function dismissCookies(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("lelam-cookie-consent", JSON.stringify({ value: "essential" }));
    } catch {
      /* ignore */
    }
  });
}

test.beforeEach(async ({ page }) => dismissCookies(page));

test("home → plain-English search → understood filters → quick view", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(/priced before you bid/i);

  await page.getByLabel("Search auctions in plain English").fill("copper scrap in Mumbai");
  await page.getByLabel("Search auctions in plain English").press("Enter");

  await expect(page).toHaveURL(/\/auctions\?q=copper/);
  const chips = page.getByRole("list", { name: "Active search and filters" });
  await expect(chips).toContainText("Scrap & Metals");
  await expect(chips).toContainText("Mumbai");

  await page.goto("/auctions");
  await page.locator("article").first().getByRole("link").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("tab", { name: /Lots/ }).click();
  await expect(dialog.getByRole("table")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("auction detail page is shareable and shows locked Bid Intelligence for visitors", async ({ page, request }) => {
  const res = await request.post("/api/auctions/search", { data: {} });
  const { items } = (await res.json()) as { items: { id: string; title: string }[] };
  await page.goto(`/auctions/${items[0].id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(items[0].title);
  await page.getByRole("tab", { name: "Bid Intelligence" }).click();
  await expect(page.getByRole("link", { name: "Create free account" })).toBeVisible();
});

test("protected pages redirect to sign-in with a safe return path", async ({ page }) => {
  await page.goto("/checkout?plan=business&cycle=monthly&trial=1");
  await expect(page).toHaveURL(/\/auth\/login\?redirect=%2Fcheckout/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("register → start Business trial → Bid Intelligence unlocks", async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`;
  await page.goto("/auth/register?redirect=/pricing");
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Buyer");
  await page.getByLabel("Work email").fill(email);
  const pw = page.locator('input[autocomplete="new-password"]');
  await pw.nth(0).fill("strongpass42");
  await pw.nth(1).fill("strongpass42");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/localhost:\d+\/pricing$/);

  // Signed-in workspace renders (not bounced to sign-in).
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/documents");
  await expect(page.getByRole("link", { name: /upgrade|see plans|pricing/i }).first()).toBeVisible();

  await page.goto("/checkout?plan=business&cycle=monthly&trial=1");
  await page.getByLabel("PIN code").fill("560008");
  await expect(page.getByLabel("State")).toHaveValue("Karnataka");
  await page.getByLabel("City").fill("Bengaluru");
  await page.getByRole("button", { name: "Start free trial" }).click();
  await expect(page.getByText("Your Business trial is live")).toBeVisible();

  const res = await page.request.post("/api/auctions/search", { data: {} });
  const { items } = (await res.json()) as { items: { id: string }[] };
  await page.goto(`/auctions/${items[0].id}`);
  await page.getByRole("tab", { name: "Bid Intelligence" }).click();
  await expect(page.getByText("Walk-away cap")).toBeVisible();
});

test("form validation shows inline errors", async ({ page }) => {
  await page.goto("/auth/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Please accept the terms to continue.")).toBeVisible();
});

test("keyboard: skip link and ⌘K search palette", async ({ page }) => {
  await page.goto("/pricing");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Control+k");
  const palette = page.getByRole("dialog", { name: "Search auctions" });
  await expect(palette).toBeVisible();
  await page.keyboard.type("vehicles near me");
  await expect(palette).toContainText("Within 200 km of you");
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
});

test("@mobile menu opens, navigates and never overflows horizontally", async ({ page }) => {
  await page.goto("/");
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Site menu" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/pricing/);
  await expect(menu).toBeHidden();
});

test("content pages render with one h1 each", async ({ page }) => {
  for (const path of ["/about", "/contact", "/faq", "/blog", "/news", "/notices", "/quotes", "/terms", "/privacy", "/cookies"]) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toHaveCount(1);
  }
});
