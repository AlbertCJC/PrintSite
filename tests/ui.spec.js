const { test, expect } = require('@playwright/test')

test('customer page loads with upload form', async ({ page }) => {
  await page.goto('http://localhost:5173/')

  await expect(page.locator('h1')).toHaveText('Upload File')
  await expect(page.locator('#file-picker')).toBeVisible()
  await expect(page.locator('#upload-btn')).toBeDisabled()
  await expect(page.locator('#edit-section')).toBeHidden()
  await expect(page.locator('#message')).toBeEmpty()
})

test('admin page loads with uploads table', async ({ page }) => {
  await page.goto('http://localhost:5173/admin')

  await expect(page.locator('h1')).toHaveText('Admin — Uploads')
  await expect(page.locator('#refresh-btn')).toBeVisible()
  await expect(page.locator('#uploads-table')).toBeVisible()
  await expect(page.locator('#uploads-tbody')).toBeAttached()
})
