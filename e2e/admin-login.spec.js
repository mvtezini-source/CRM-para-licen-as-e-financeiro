import { test, expect } from '@playwright/test';

test('admin login shows admin area', async ({ page }) => {
  // go to app (dev server should be running on baseURL)
  await page.goto('/');

  // Wait for login form
  await page.waitForSelector('text=Entrar');

  // Fill login inputs (placeholders in Portuguese)
  await page.fill('input[placeholder="Usuário (id)"]', 'admin2');
  await page.fill('input[placeholder="Senha"]', 'AdminPass123!');

  // Click Entrar
  await page.click('button:has-text("Entrar")');

  // Wait for navigation and UI update
  await page.waitForTimeout(800);

  // Verify Administração button appears
  const adminBtn = page.locator('button', { hasText: 'Administração' });
  await expect(adminBtn).toBeVisible();
});
