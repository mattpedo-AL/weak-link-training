// @ts-check
const { test: base, expect } = require("@playwright/test");

// Every test fails if the page throws an uncaught error.
const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await use(page);
    expect(errors, "pageerror events").toEqual([]);
  },
});

const heading = page => page.locator("main h1");

test.beforeEach(async ({ page }) => {
  // Keep the Google Fonts request from slowing tests or failing offline.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
});

test("1. pick a day: heading changes and survives reload", async ({ page }) => {
  await page.goto("./#today");
  const day1 = await heading(page).textContent();
  const opts = await page.locator("#daySel option").allTextContents();
  const target = opts[2].replace(/^Day \d+: /, "");
  expect(target).not.toBe(day1);

  await page.selectOption("#daySel", "2");
  await expect(heading(page)).toHaveText(target);

  await page.reload();
  await expect(heading(page)).toHaveText(target);
  await expect(page.locator("#daySel")).toHaveValue("2");
});

test("2. log a set and finish: session saved, next day shown, survives reload", async ({ page }) => {
  await page.goto("./#today");
  const opts = (await page.locator("#daySel option").allTextContents()).map(o => o.replace(/^Day \d+: /, ""));
  await expect(heading(page)).toHaveText(opts[0]);

  await page.fill("#w-0-0", "60");
  await page.fill("#r-0-0", "8");
  const tick = page.locator('[data-tick][data-j="0"]').first();
  await tick.click();
  await expect(tick).toHaveClass(/done/);
  await page.click("#restStop");

  await page.click("#finish");
  await expect(page.locator("#mTitle")).toHaveText("Session saved");
  await expect(page.locator("#mBody")).toContainText(`Next: ${opts[1]}`);
  await page.locator("#mBtns button", { hasText: "Done" }).click();
  await expect(heading(page)).toHaveText(opts[1]);

  await page.reload();
  await expect(heading(page)).toHaveText(opts[1]);
  await page.goto("./#progress");
  await expect(page.locator("#view")).toContainText("60×8");
});

test("3. a lift typed on Assess survives reload", async ({ page }) => {
  await page.goto("./#assess");
  const input = page.locator('[data-lift][data-f="w"]').first();
  const id = await input.getAttribute("id");
  await input.fill("123");

  await page.reload();
  await expect(page.locator(`#${id}`)).toHaveValue("123");
});

test("4. export, reset, import restores data", async ({ page }, info) => {
  // Make some data worth restoring: a custom lift and a finished session.
  await page.goto("./#assess");
  const lift = page.locator('[data-lift][data-f="w"]').first();
  const liftId = await lift.getAttribute("id");
  await lift.fill("137.5");
  await page.goto("./#today");
  await page.fill("#w-0-0", "42");
  await page.fill("#r-0-0", "7");
  await page.click("#finish");
  await expect(page.locator("#mTitle")).toHaveText("Session saved");
  await page.locator("#mBtns button", { hasText: "Done" }).click();

  // Export
  await page.goto("./#plan");
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("#exportBtn")]);
  expect(download.suggestedFilename()).toMatch(/^weak-link-backup-.*\.json$/);
  const file = info.outputPath("backup.json");
  await download.saveAs(file);

  // Reset
  await page.click("#resetAll");
  await expect(page.locator("#mTitle")).toHaveText("Reset all data?");
  await page.locator("#mBtns button", { hasText: "Reset" }).click();
  await page.goto("./#assess");
  await expect(page.locator(`#${liftId}`)).not.toHaveValue("137.5");
  await page.goto("./#progress");
  await expect(page.locator("#view")).not.toContainText("42×7");

  // Import
  await page.goto("./#plan");
  await page.setInputFiles("#importFile", file);
  await expect(page.locator("#mTitle")).toHaveText("Restore this backup?");
  await page.locator("#mBtns button", { hasText: "Restore" }).click();
  await expect(page.locator("#mTitle")).toHaveText("Backup restored");
  await page.locator("#mBtns button", { hasText: "Done" }).click();

  await page.reload();
  await page.goto("./#assess");
  await expect(page.locator(`#${liftId}`)).toHaveValue("137.5");
  await page.goto("./#progress");
  await expect(page.locator("#view")).toContainText("42×7");
});

test("5. service worker controls the page and reload works offline", async ({ page, context }) => {
  await page.goto("./#today");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const day = await heading(page).textContent();

  await context.setOffline(true);
  await page.reload();
  await expect(heading(page)).toHaveText(day || "");
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(false);
});

/* Regression checks for the two rough edges listed in CLAUDE.md */

test("sticky header status line is opaque, so content doesn't show through", async ({ page }) => {
  await page.goto("./#today");
  const bg = await page.locator("#syncState").evaluate(el => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe("rgba(0, 0, 0, 0)");
  expect(bg).not.toBe("transparent");
});

test("ticking a set with no reps asks for reps instead of logging nothing", async ({ page }) => {
  await page.goto("./#today");
  const reps = page.locator("#r-0-0");
  await expect(reps).toHaveAttribute("placeholder", "reps");
  const tick = page.locator('[data-tick][data-j="0"]').first();
  await tick.click();
  await expect(tick).not.toHaveClass(/done/);
  await expect(reps).toBeFocused();
  await expect(reps).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#restbar")).toBeHidden();

  await reps.fill("6");
  await expect(reps).not.toHaveAttribute("aria-invalid", "true");
  await tick.click();
  await expect(tick).toHaveClass(/done/);
});

/* Regression checks for bugs found in the debug pass */

test("swapping an exercise mid-session keeps the sets already logged", async ({ page }) => {
  await page.goto("./#today");
  await page.fill("#w-0-0", "61");
  await page.fill("#r-0-0", "8");
  await page.locator('[data-tick][data-j="0"]').first().click();
  await page.click("#restStop");

  await page.locator("[data-swap]").first().click();
  await page.locator("#mBody button[data-pick]:not(.cur)").first().click();

  await page.click("#finish");
  await expect(page.locator("#mTitle")).toHaveText("Session saved");
  await page.locator("#mBtns button", { hasText: "Done" }).click();
  await page.goto("./#progress");
  await expect(page.locator("#view")).toContainText("61×8");
});

test("switching day with sets entered asks first, and Cancel keeps them", async ({ page }) => {
  await page.goto("./#today");
  const day1 = await heading(page).textContent();
  await page.fill("#w-0-0", "55");
  await page.fill("#r-0-0", "6");

  await page.selectOption("#daySel", "1");
  await expect(page.locator("#mTitle")).toHaveText("Switch day?");
  await page.locator("#mBtns button", { hasText: "Cancel" }).click();
  await expect(heading(page)).toHaveText(day1 || "");
  await expect(page.locator("#daySel")).toHaveValue("0");
  await expect(page.locator("#w-0-0")).toHaveValue("55");

  await page.selectOption("#daySel", "1");
  await page.locator("#mBtns button", { hasText: "Switch" }).click();
  await expect(heading(page)).not.toHaveText(day1 || "");
});

test("Program page shows the right phase after phase 6", async ({ page }) => {
  await page.goto("./#today");
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("wl.profile") || "null") || {};
    p.prog = { phase: 7, week: 2, day: 0 };
    localStorage.setItem("wl.profile", JSON.stringify(p));
  });
  await page.goto("./#plan");
  await page.reload();
  await expect(page.locator("#pPhase")).toHaveValue("7");
});
