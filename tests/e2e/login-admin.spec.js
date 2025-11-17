import { test, expect } from '@playwright/test';

// Environment assumption: frontend is running at http://localhost:3000 (Vite)
// Backend must be available at http://localhost:4000 (Vite proxy will forward /api)

test('admin login shows Administration button', async ({ page }) => {
  const base = process.env.E2E_BASE || 'http://localhost:3000';
  await page.goto(base);

  // Wait for login form
  await page.waitForSelector('input[placeholder="Usuário (id)"]');

  // Fill credentials for admin2 (created by setup)
  await page.fill('input[placeholder="Usuário (id)"]', 'admin2');
  await page.fill('input[placeholder="Senha"]', 'AdminPass123!');
  await page.click('button:has-text("Entrar")');

  // Wait for user greeting
  await page.waitForSelector('text=Olá,', { timeout: 5000 });

  // Check that Administração button exists
  const adminButton = page.locator('button', { hasText: 'Administração' });
  await expect(adminButton).toBeVisible();
});
