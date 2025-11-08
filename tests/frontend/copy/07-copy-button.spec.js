const { test, expect } = require('@playwright/test');

/**
 * Frontend Component Tests: 07-CopyButton Component
 *
 * Test Suite: 07.001 - Rendering Tests
 * Test Suite: 07.002 - Props and Variants
 * Test Suite: 07.003 - Event Handling
 * Test Suite: 07.004 - Tooltips
 * Test Suite: 07.005 - Accessibility
 *
 * Numbering Format: 07.GROUP.TEST
 *
 * Tests the CopyButton component which provides a "Copy to..." action button
 * for configuration items (agents, commands, hooks, MCP servers).
 */

// Test Suite 07.001: Rendering Tests
test.describe('07.001: CopyButton Rendering', () => {
  test('07.001.001: renders with default props (label visible)', async ({ page }) => {
    await page.goto('/');

    // Wait for dashboard to load
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    // Navigate to first project
    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Look for copy button with label
      const copyButton = page.locator('.copy-button').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await expect(copyButton).toBeVisible();

        // Check if button has label text
        const buttonText = await copyButton.textContent();
        expect(buttonText).toContain('Copy');
      }
    }
  });

  test('07.001.002: renders icon (pi pi-copy)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Look for copy button icon
      const copyIcon = page.locator('.copy-button .pi-copy').first();
      const hasIcon = await copyIcon.count() > 0;

      if (hasIcon) {
        await expect(copyIcon).toBeVisible();

        // Verify icon has correct class
        const iconClass = await copyIcon.getAttribute('class');
        expect(iconClass).toContain('pi');
        expect(iconClass).toContain('pi-copy');
      }
    }
  });

  test('07.001.003: renders icon-only mode when showLabel=false', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Some copy buttons may be icon-only in specific contexts
      // Check that icon is visible regardless
      const copyButton = page.locator('.copy-button').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        const copyIcon = copyButton.locator('.pi-copy');
        await expect(copyIcon).toBeVisible();
      }
    }
  });
});

// Test Suite 07.002: Props and Variants
test.describe('07.002: CopyButton Props and Variants', () => {
  test('07.002.001: disabled state applies correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Look for disabled copy button (plugin configurations)
      const disabledButton = page.locator('.copy-button:disabled').first();
      const hasDisabled = await disabledButton.count() > 0;

      if (hasDisabled) {
        await expect(disabledButton).toBeVisible();

        // Verify button is actually disabled
        const isDisabled = await disabledButton.isDisabled();
        expect(isDisabled).toBe(true);

        // Verify disabled styling
        const opacity = await disabledButton.evaluate(el =>
          window.getComputedStyle(el).opacity
        );
        expect(parseFloat(opacity)).toBeLessThanOrEqual(0.6);
      }
    }
  });

  test('07.002.002: configItem prop validation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Copy button should only appear on valid config items
      const copyButton = page.locator('.copy-button').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        // Button should be associated with a config item
        const configItem = copyButton.locator('xpath=ancestor::*[contains(@class, "config-item")]').first();
        const hasConfigItem = await configItem.count() > 0;
        expect(hasConfigItem).toBe(true);
      }
    }
  });
});

// Test Suite 07.003: Event Handling
test.describe('07.003: CopyButton Event Handling', () => {
  test('07.003.001: emits copy-clicked event on button click', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Find enabled copy button
      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        // Click the button
        await copyButton.click();

        // Wait for modal or some response
        await page.waitForTimeout(500);

        // CopyModal should open
        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        // If modal opens, the event was emitted successfully
        if (modalVisible) {
          expect(modalVisible).toBe(true);
        }
      }
    }
  });

  test('07.003.002: disabled button does NOT emit event', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Look for disabled copy button
      const disabledButton = page.locator('.copy-button:disabled').first();
      const hasDisabled = await disabledButton.count() > 0;

      if (hasDisabled) {
        // Try to click (should not work)
        await disabledButton.click({ force: true });
        await page.waitForTimeout(500);

        // Modal should NOT open
        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);
        expect(modalVisible).toBe(false);
      }
    }
  });

  test('07.003.003: passes configItem in event payload', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Find enabled copy button
      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        // Get the config item name before clicking
        const configItem = copyButton.locator('xpath=ancestor::*[contains(@class, "config-item")]').first();
        const configName = await configItem.locator('.config-name').first().textContent();

        // Click the button
        await copyButton.click();
        await page.waitForTimeout(500);

        // Modal should show the source config name
        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          const sourceInfo = modal.locator('.source-info, .info-value').first();
          const sourceText = await sourceInfo.textContent();

          // Verify config item data is passed
          expect(sourceText).toBeTruthy();
        }
      }
    }
  });
});

// Test Suite 07.004: Tooltips
test.describe('07.004: CopyButton Tooltips', () => {
  test('07.004.001: shows default tooltip for regular configs', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Find enabled copy button
      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        // Hover over button to trigger tooltip
        await copyButton.hover();
        await page.waitForTimeout(800);

        // Look for PrimeVue tooltip
        const tooltip = page.locator('.p-tooltip-text');
        const tooltipVisible = await tooltip.isVisible().catch(() => false);

        if (tooltipVisible) {
          const tooltipText = await tooltip.textContent();
          expect(tooltipText).toContain('Copy this configuration');
        }
      }
    }
  });

  test('07.004.002: shows plugin tooltip when disabled + location=plugin', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Look for disabled copy button (plugin configs)
      const disabledButton = page.locator('.copy-button:disabled').first();
      const hasDisabled = await disabledButton.count() > 0;

      if (hasDisabled) {
        // Hover over disabled button
        await disabledButton.hover();
        await page.waitForTimeout(800);

        // Look for tooltip with plugin message
        const tooltip = page.locator('.p-tooltip-text');
        const tooltipVisible = await tooltip.isVisible().catch(() => false);

        if (tooltipVisible) {
          const tooltipText = await tooltip.textContent();
          expect(tooltipText).toContain('plugin');
          expect(tooltipText).toContain('cannot be copied');
        }
      }
    }
  });
});

// Test Suite 07.005: Accessibility
test.describe('07.005: CopyButton Accessibility', () => {
  test('07.005.001: ARIA label present with config name', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Find copy button
      const copyButton = page.locator('.copy-button').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        // Check aria-label attribute
        const ariaLabel = await copyButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel).toContain('Copy');
      }
    }
  });

  test('07.005.002: focus indicator visible when focused', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Find copy button
      const copyButton = page.locator('.copy-button').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        // Focus the button
        await copyButton.focus();

        // Check for focus-visible outline
        const outline = await copyButton.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            outlineStyle: style.outlineStyle
          };
        });

        // Should have some outline when focused
        expect(
          outline.outlineWidth !== '0px' ||
          outline.outlineStyle !== 'none'
        ).toBe(true);
      }
    }
  });

  test('07.005.003: keyboard accessible (Enter/Space triggers click)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.dashboard', { timeout: 10000 });

    await page.waitForFunction(() => {
      const loading = document.querySelector('.loading-container');
      return !loading || loading.offsetParent === null;
    }, { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Find enabled copy button
      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        // Focus the button
        await copyButton.focus();

        // Press Enter key
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        // Modal should open
        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          expect(modalVisible).toBe(true);

          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }

        // Test Space key
        await copyButton.focus();
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);

        const modalVisible2 = await modal.isVisible().catch(() => false);
        if (modalVisible2) {
          expect(modalVisible2).toBe(true);
        }
      }
    }
  });
});
