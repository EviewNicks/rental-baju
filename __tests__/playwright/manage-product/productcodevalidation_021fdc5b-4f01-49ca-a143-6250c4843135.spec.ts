
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('ProductCodeValidation_2025-10-15', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3000');

    // Navigate to URL
    await page.goto('http://localhost:3000/producer/manage-product/add');

    // Fill input field
    await page.fill('[data-testid="product-code-field"] input', 'DRESS001');
});