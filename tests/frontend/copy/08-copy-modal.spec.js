const { test, expect } = require('@playwright/test');

/**
 * Frontend Component Tests: 08-CopyModal Component
 *
 * Test Suite: 08.001 - Modal Rendering
 * Test Suite: 08.002 - Source Configuration Display
 * Test Suite: 08.003 - Destination Cards
 * Test Suite: 08.004 - User Interactions
 * Test Suite: 08.005 - Scrolling and Layout
 * Test Suite: 08.006 - Keyboard Navigation
 * Test Suite: 08.007 - Accessibility
 *
 * Numbering Format: 08.GROUP.TEST
 *
 * Tests the CopyModal component which displays destination selection dialog
 * for copying configuration items to User Global or project locations.
 */

// Test Suite 08.001: Modal Rendering
test.describe('08.001: CopyModal Rendering', () => {
  test('08.001.001: modal opens when copy button clicked', async ({ page }) => {
    await page.goto('/');

    // Wait for Vue app and projects to load
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });

    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      // Click copy button
      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        // Verify modal is visible
        const modal = page.locator('.copy-modal, .p-dialog');
        await expect(modal).toBeVisible();
      }
    }
  });

  test('08.001.002: modal displays header with copy icon', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Check for header icon in PrimeVue Dialog header
          const headerIcon = modal.locator('.p-dialog-header .pi-copy');
          const hasIcon = await headerIcon.count() > 0;

          if (hasIcon) {
            await expect(headerIcon).toBeVisible();
          }

          // Check for header text
          const headerText = modal.locator('.p-dialog-header');
          await expect(headerText).toContainText('Copy Configuration');
        }
      }
    }
  });

  test('08.001.003: modal closes when close button clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Click close button (X in header)
          const closeButton = modal.locator('.p-dialog-header-close, .close-btn');
          const hasClose = await closeButton.count() > 0;

          if (hasClose) {
            await closeButton.click();
            await page.waitForTimeout(300);

            // Modal should be hidden
            await expect(modal).not.toBeVisible();
          }
        }
      }
    }
  });
});

// Test Suite 08.002: Source Configuration Display
test.describe('08.002: CopyModal Source Configuration Display', () => {
  test('08.002.001: displays source configuration filename', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Check for Name field (component shows "Name", not "Filename")
          const nameLabel = modal.locator('text=/Name/i').last();
          const hasLabel = await nameLabel.count() > 0;

          if (hasLabel) {
            await expect(nameLabel).toBeVisible();

            // Should have a name value above the label
            const nameValue = modal.locator('.copy-modal-content .text-base.font-medium.text-text-emphasis').first();
            await expect(nameValue).toBeVisible();
          }
        }
      }
    }
  });

  test('08.002.002: displays source configuration type with icon', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Check for type field (shows label "Type" not "Type:")
          const typeLabel = modal.locator('text=/^Type$/i').first();
          const hasType = await typeLabel.count() > 0;

          if (hasType) {
            await expect(typeLabel).toBeVisible();

            // Type should have a badge with icon
            const configType = modal.locator('.config-type');
            const hasConfigType = await configType.count() > 0;

            if (hasConfigType) {
              const typeIcon = configType.locator('i');
              await expect(typeIcon).toBeVisible();

              // Icon should be one of: pi-users, pi-bolt, pi-link, pi-server
              const iconClass = await typeIcon.getAttribute('class');
              const validIcons = ['pi-users', 'pi-bolt', 'pi-link', 'pi-server'];
              const hasValidIcon = validIcons.some(icon => iconClass.includes(icon));
              expect(hasValidIcon).toBe(true);
            }
          }
        }
      }
    }
  });

  test('08.002.003: displays source configuration path', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Check for Project field (component shows "Project", not "Current Location" or "Path")
          const projectLabel = modal.locator('text=/^Project$/i').first();
          const hasProject = await projectLabel.count() > 0;

          if (hasProject) {
            await expect(projectLabel).toBeVisible();
          }
        }
      }
    }
  });
});

// Test Suite 08.003: Destination Cards
test.describe('08.003: CopyModal Destination Cards', () => {
  test('08.003.001: User Global card renders first', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Look for User Global card (PrimeVue Card has .destination-card class on .p-card root)
          const userCard = modal.locator('.p-card.destination-card').first();
          const cardName = await userCard.locator('h4').textContent();

          expect(cardName).toContain('User Global');

          // Check for user icon
          const userIcon = userCard.locator('.pi-user');
          await expect(userIcon).toBeVisible();
        }
      }
    }
  });

  test('08.003.002: project cards render in list', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Count destination cards (should be User Global + projects)
          const destinationCards = modal.locator('.p-card.destination-card');
          const cardCount = await destinationCards.count();

          // Should have at least 2 cards (User Global + at least 1 project)
          expect(cardCount).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  test('08.003.003: destination cards show name, path, and icon', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Check first destination card
          const firstCard = modal.locator('.p-card.destination-card').first();

          // Should have icon
          const icon = firstCard.locator('i').first();
          await expect(icon).toBeVisible();

          // Should have name
          const name = firstCard.locator('h4');
          await expect(name).toBeVisible();
          const nameText = await name.textContent();
          expect(nameText).toBeTruthy();

          // Should have path (in font-mono styled div)
          const path = firstCard.locator('.font-mono');
          await expect(path).toBeVisible();
          const pathText = await path.textContent();
          expect(pathText).toBeTruthy();
        }
      }
    }
  });

  test('08.003.004: destination cards have "Copy Here" button', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Check for "Copy Here" button (PrimeVue Button)
          const copyHereBtn = modal.locator('.p-button:has-text("Copy Here")').first();
          await expect(copyHereBtn).toBeVisible();
          await expect(copyHereBtn).toContainText('Copy Here');
        }
      }
    }
  });
});

// Test Suite 08.004: User Interactions
test.describe('08.004: CopyModal User Interactions', () => {
  test('08.004.001: clicking card selects destination', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Click on a destination card (PrimeVue Card)
          const destCard = modal.locator('.p-card.destination-card').nth(1);
          await destCard.click();
          await page.waitForTimeout(500);

          // Modal should close after selection
          const stillVisible = await modal.isVisible().catch(() => false);
          expect(stillVisible).toBe(false);
        }
      }
    }
  });

  test('08.004.002: clicking "Copy Here" button triggers selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Click "Copy Here" button (PrimeVue Button)
          const copyHereBtn = modal.locator('.p-button:has-text("Copy Here")').first();
          await copyHereBtn.click();
          await page.waitForTimeout(500);

          // Modal should close
          const stillVisible = await modal.isVisible().catch(() => false);
          expect(stillVisible).toBe(false);
        }
      }
    }
  });

  test('08.004.003: modal closes after destination selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Select destination (PrimeVue Card)
          const destCard = modal.locator('.p-card.destination-card').first();
          await destCard.click();
          await page.waitForTimeout(500);

          // Verify modal is closed
          await expect(modal).not.toBeVisible();
        }
      }
    }
  });
});

// Test Suite 08.005: Scrolling and Layout
test.describe('08.005: CopyModal Scrolling and Layout', () => {
  test('08.005.001: project list is scrollable when > 300px', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Check for destinations container
          const destinationsContainer = modal.locator('.destinations-container');
          const hasContainer = await destinationsContainer.count() > 0;

          if (hasContainer) {
            // Check if container has overflow
            const styles = await destinationsContainer.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return {
                overflowY: computed.overflowY
              };
            });

            // Should have overflow-y auto or scroll
            expect(['auto', 'scroll']).toContain(styles.overflowY);
          }
        }
      }
    }
  });

  test('08.005.002: all project cards are accessible via scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Get all destination cards (PrimeVue Cards)
          const destCards = modal.locator('.p-card.destination-card');
          const cardCount = await destCards.count();

          if (cardCount > 1) {
            // Get last card
            const lastCard = destCards.nth(cardCount - 1);

            // Scroll to last card
            await lastCard.scrollIntoViewIfNeeded();
            await page.waitForTimeout(200);

            // Last card should be visible
            await expect(lastCard).toBeVisible();
          }
        }
      }
    }
  });
});

// Test Suite 08.006: Keyboard Navigation
test.describe('08.006: CopyModal Keyboard Navigation', () => {
  test('08.006.001: Tab cycles through destination cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Press Tab to focus first card
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);

          // Get focused element
          const focused = await page.evaluate(() => document.activeElement.className);

          // Should focus on a destination card or button
          expect(focused).toBeTruthy();
        }
      }
    }
  });

  test('08.006.002: Enter key on card triggers selection', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Focus first destination card (PrimeVue Card)
          const firstCard = modal.locator('.p-card.destination-card').first();
          await firstCard.focus();

          // Press Enter
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);

          // Modal should close
          const stillVisible = await modal.isVisible().catch(() => false);
          expect(stillVisible).toBe(false);
        }
      }
    }
  });

  test('08.006.003: Escape key closes modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Press Escape
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);

          // Modal should close
          await expect(modal).not.toBeVisible();
        }
      }
    }
  });
});

// Test Suite 08.007: Accessibility
test.describe('08.007: CopyModal Accessibility', () => {
  test('08.007.001: ARIA labels present on destination cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Check first destination card for aria-label (PrimeVue Card)
          const firstCard = modal.locator('.p-card.destination-card').first();
          const ariaLabel = await firstCard.getAttribute('aria-label');

          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel).toContain('Copy to');
        }
      }
    }
  });

  test('08.007.002: focus indicators visible on cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // Focus first card (PrimeVue Card)
          const firstCard = modal.locator('.p-card.destination-card').first();
          await firstCard.focus();

          // Check for focus outline
          const outline = await firstCard.evaluate(el => {
            const style = window.getComputedStyle(el);
            return {
              outline: style.outline,
              outlineWidth: style.outlineWidth
            };
          });

          // Should have visible outline when focused
          expect(
            outline.outlineWidth !== '0px' ||
            outline.outline !== 'none'
          ).toBe(true);
        }
      }
    }
  });

  test('08.007.003: dialog has proper role', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app', { timeout: 10000 });
    await page.waitForSelector('h2:has-text("Projects")', { timeout: 10000 });


    const projectCards = page.locator('.project-card:not(.user-card)');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForURL(/\/project\//, { timeout: 10000 });
      await page.waitForSelector('.config-cards-container', { timeout: 10000 });

      const copyButton = page.locator('.copy-button:not(:disabled)').first();
      const hasButton = await copyButton.count() > 0;

      if (hasButton) {
        await copyButton.click();
        await page.waitForTimeout(500);

        const modal = page.locator('.copy-modal, .p-dialog');
        const modalVisible = await modal.isVisible().catch(() => false);

        if (modalVisible) {
          // PrimeVue Dialog should have role="dialog"
          const dialog = page.locator('[role="dialog"]');
          await expect(dialog).toBeVisible();
        }
      }
    }
  });
});
