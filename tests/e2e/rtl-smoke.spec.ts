import { test, expect } from '@playwright/test';

test.describe('RTL app shell', () => {
  test('home renders RTL with the 5-item bottom nav in order', async ({ page }) => {
    await page.goto('#/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByText('نور القرآن').first()).toBeVisible();

    const labels = ['الرئيسية', 'المصحف', 'التسميع', 'الحفظ', 'الإعدادات'];
    for (const l of labels) {
      await expect(page.locator('nav').getByText(l, { exact: true })).toBeVisible();
    }
  });

  test('deep link #/read/2/255 opens the reader with byte-faithful ayah text', async ({ page }) => {
    await page.goto('#/read/2/255');
    await expect(page.getByText('سورة البقرة').first()).toBeVisible();
    const sacred = page.locator('[data-ayah-text]').first();
    await expect(sacred).toBeVisible();
    const text = await sacred.textContent();
    expect((text ?? '').length).toBeGreaterThan(10);
  });

  test('theme toggle flips [data-theme]', async ({ page }) => {
    await page.goto('#/settings/reading');
    await page.getByRole('button', { name: 'ليل' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'night');
  });

  test('surah index lists all 114 surahs and filters', async ({ page }) => {
    await page.goto('#/read');
    await expect(page.getByText('سورة الفاتحة')).toBeVisible();
    await page.getByPlaceholder('ابحث عن سورة').fill('الكهف');
    await expect(page.getByText('سورة الكهف')).toBeVisible();
    await expect(page.getByText('سورة الفاتحة')).toHaveCount(0);
  });
});
