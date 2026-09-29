/**
 * website/tests/unit/welcomeModal.test.mjs
 * Unit test for First-Visit Welcome & Warning Modal
 */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { renderWelcomeModal, isWarningDismissed, dismissWarning } from '../../src/components/welcomeModal.js';

describe('First-Visit Welcome & Warning Modal Test Suite', () => {
  beforeEach(() => {
    if (typeof global.localStorage === 'undefined') {
      const storage = new Map();
      global.localStorage = {
        getItem: (k) => storage.get(k) || null,
        setItem: (k, v) => storage.set(k, String(v)),
        removeItem: (k) => storage.delete(k),
        clear: () => storage.clear()
      };
    } else {
      global.localStorage.clear();
    }
  });

  test('renderWelcomeModal renders warning text and button', () => {
    const html = renderWelcomeModal();
    assert.ok(html.includes('welcome-modal-overlay'), 'Should contain modal overlay');
    assert.ok(html.includes('welcome-warning-box'), 'Should contain warning box');
    assert.ok(html.includes('welcome-modal-confirm-btn'), 'Should contain confirm button');
  });

  test('isWarningDismissed and dismissWarning interaction with localStorage', () => {
    assert.strictEqual(isWarningDismissed(), false, 'Initially not dismissed');
    dismissWarning();
    assert.strictEqual(isWarningDismissed(), true, 'Dismissed after dismissWarning()');
  });
});
