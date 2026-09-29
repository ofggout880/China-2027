/**
 * website/tests/unit/challenger-m3-it2-adversarial.test.mjs
 * Challenger 1 Adversarial Stress & Verification Suite for M3 Iteration 2
 *
 * Specific Verification Tasks:
 * 1. Verify checklist-adversarial test 2.3 and 2.5 pass with zero exceptions.
 * 2. Stress-test resolveStorage under custom proxy objects that throw SecurityError, TypeError, or DOMException on property accesses.
 * 3. Test high-frequency toggling (1,000 rapid cycles) under failing storage.
 * 4. Verify memory fallback does not leak state across instances.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  CHECKLIST_ITEMS,
} from '../../src/data/checklistData.js';

import {
  STORAGE_KEY,
  InMemoryStorage,
  ChecklistStore,
  resolveStorage,
  globalMemoryFallback,
  resetGlobalMemoryFallback,
} from '../../src/components/documentChecklist.js';

describe('Challenger M3 Iteration 2: Adversarial Storage & Security Stress Suite', () => {

  beforeEach(() => {
    resetGlobalMemoryFallback();
  });

  /* ========================================================================= */
  /* Task 1: Baseline Verification of Tests 2.3 and 2.5                        */
  /* ========================================================================= */
  describe('Task 1: Verification of Test 2.3 and 2.5 baseline resilience', () => {
    test('1.1 Test 2.3 equivalent: window.localStorage getter throwing SecurityError must not throw and fallback gracefully', () => {
      const originalWindow = globalThis.window;
      const mockWin = {};
      Object.defineProperty(mockWin, 'localStorage', {
        get() {
          const err = new Error('SecurityError: The operation is insecure (Access is denied for this document).');
          err.name = 'SecurityError';
          throw err;
        },
        configurable: true,
      });

      globalThis.window = mockWin;
      try {
        let store;
        assert.doesNotThrow(() => {
          store = new ChecklistStore(CHECKLIST_ITEMS);
        });
        assert.ok(store, 'Store must be successfully created');
        assert.strictEqual(store.getCompletedCount(), 2, 'Default completed items intact');
        assert.strictEqual(store.isChecked('doc_passport'), true);
        assert.strictEqual(store.isChecked('doc_transcripts'), true);
        assert.strictEqual(store.isChecked('doc_language'), false);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('1.2 Test 2.5 equivalent: resetting globalMemoryFallback isolates fresh instances', () => {
      resetGlobalMemoryFallback();
      const s1 = new ChecklistStore();
      s1.toggle('doc_financial');
      assert.strictEqual(s1.isChecked('doc_financial'), true);

      // Reset shared fallback
      resetGlobalMemoryFallback();

      const s2 = new ChecklistStore();
      assert.strictEqual(s2.isChecked('doc_financial'), false, 'Resetting global memory fallback restores clean baseline for new instances');
      assert.strictEqual(s2.getCompletedCount(), 2);
    });
  });

  /* ========================================================================= */
  /* Task 2: Hostile Proxy Stress-Testing on resolveStorage                     */
  /* ========================================================================= */
  describe('Task 2: Hostile Proxy Stress on resolveStorage()', () => {
    const originalWindow = globalThis.window;

    test('2.1 Window Proxy throwing SecurityError on window.localStorage access', () => {
      const hostileWindow = new Proxy({}, {
        get(target, prop) {
          if (prop === 'localStorage') {
            const err = new Error('Access to Storage is blocked by user policy');
            err.name = 'SecurityError';
            throw err;
          }
          return undefined;
        },
      });

      globalThis.window = hostileWindow;
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('2.2 Window Proxy throwing TypeError on window.localStorage access', () => {
      const hostileWindow = new Proxy({}, {
        get(target, prop) {
          if (prop === 'localStorage') {
            throw new TypeError('Cannot read properties of null (reading "localStorage")');
          }
          return undefined;
        },
      });

      globalThis.window = hostileWindow;
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('2.3 Window Proxy throwing DOMException on window.localStorage access', () => {
      const hostileWindow = new Proxy({}, {
        get(target, prop) {
          if (prop === 'localStorage') {
            throw new DOMException('Cross-origin frame storage restricted', 'NotAllowedError');
          }
          return undefined;
        },
      });

      globalThis.window = hostileWindow;
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('2.4 Storage Proxy throwing SecurityError when accessing storage.setItem getter', () => {
      const hostileStorage = new Proxy({}, {
        get(target, prop) {
          if (prop === 'setItem') {
            const err = new Error('SecurityError: Property access blocked');
            err.name = 'SecurityError';
            throw err;
          }
          return undefined;
        },
      });

      globalThis.window = { localStorage: hostileStorage };
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('2.5 Storage Proxy throwing TypeError when invoking setItem', () => {
      const hostileStorage = {
        setItem() {
          throw new TypeError('Failed to execute setItem on Storage: 2 arguments required');
        },
        removeItem() {},
      };

      globalThis.window = { localStorage: hostileStorage };
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('2.6 Storage Proxy throwing DOMException (QuotaExceededError) during testKey write', () => {
      const quotaStorage = {
        setItem() {
          throw new DOMException('Storage quota limit reached', 'QuotaExceededError');
        },
        removeItem() {},
      };

      globalThis.window = { localStorage: quotaStorage };
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('2.7 Storage Proxy throwing SecurityError when invoking removeItem', () => {
      const hostileStorage = {
        setItem() {},
        removeItem() {
          throw new DOMException('removeItem is restricted in sandbox', 'SecurityError');
        },
      };

      globalThis.window = { localStorage: hostileStorage };
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('2.8 Revoked Proxy storage throws TypeError upon any access', () => {
      const { proxy, revoke } = Proxy.revocable({ setItem() {}, removeItem() {} }, {});
      revoke(); // Immediately revoke

      globalThis.window = { localStorage: proxy };
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });

    test('2.9 Corrupted window.localStorage types (primitives: 42, "invalid", Symbol) fallback gracefully', () => {
      [42, 'invalid_string', Symbol('storage'), true].forEach((corruptPrimitive) => {
        globalThis.window = { localStorage: corruptPrimitive };
        try {
          let resolved;
          assert.doesNotThrow(() => {
            resolved = resolveStorage();
          }, `Primitive ${String(corruptPrimitive)} must not throw uncaught error`);
          assert.strictEqual(resolved, globalMemoryFallback);
        } finally {
          globalThis.window = originalWindow;
        }
      });
    });

    test('2.10 Completely hostile Proxy window throwing on EVERY property get', () => {
      const hostileGlobal = new Proxy({}, {
        get(target, prop) {
          // Allow internal Node inspect symbols
          if (typeof prop === 'symbol') return undefined;
          throw new DOMException(`Denying access to window.${String(prop)}`, 'SecurityError');
        },
      });

      globalThis.window = hostileGlobal;
      try {
        let resolved;
        assert.doesNotThrow(() => {
          resolved = resolveStorage();
        });
        assert.strictEqual(resolved, globalMemoryFallback);
      } finally {
        globalThis.window = originalWindow;
      }
    });
  });

  /* ========================================================================= */
  /* Task 3: High-Frequency Toggling (1,000 Rapid Cycles) Under Failing Storage */
  /* ========================================================================= */
  describe('Task 3: High-Frequency Toggling (1,000 cycles) Under Failing Storage', () => {
    test('3.1 1,000 rapid toggles under SecurityError-throwing setItem', () => {
      const failingStorage = {
        store: new Map(),
        getItem(key) { return this.store.get(key) || null; },
        setItem() {
          const err = new Error('SecurityError: The operation is insecure');
          err.name = 'SecurityError';
          throw err;
        },
        removeItem(key) { this.store.delete(key); },
      };

      const store = new ChecklistStore(CHECKLIST_ITEMS, failingStorage);
      let listenerCount = 0;
      let lastVal = null;

      store.subscribe((itemId, nextVal, summary) => {
        if (itemId === 'doc_financial') {
          listenerCount++;
          lastVal = nextVal;
          assert.ok(summary.percentage >= 0 && summary.percentage <= 100);
        }
      });

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        const res = store.toggle('doc_financial');
        assert.strictEqual(typeof res, 'boolean');
      }
      const durationMs = performance.now() - startTime;

      // 1000 toggles on starting false value -> ends on false
      assert.strictEqual(store.isChecked('doc_financial'), false);
      assert.strictEqual(listenerCount, 1000);
      assert.strictEqual(lastVal, false);
      assert.strictEqual(store.getCompletedCount(), 2);
      assert.ok(durationMs < 500, `1,000 toggles took ${durationMs.toFixed(2)}ms, must be < 500ms`);
    });

    test('3.2 1,000 rapid toggles under QuotaExceededError-throwing setItem', () => {
      const failingStorage = {
        store: new Map(),
        getItem() { return null; },
        setItem() {
          throw new DOMException('Storage quota limit reached', 'QuotaExceededError');
        },
        removeItem() {},
      };

      const store = new ChecklistStore(CHECKLIST_ITEMS, failingStorage);
      let listenerCount = 0;

      store.subscribe((itemId, nextVal, summary) => {
        listenerCount++;
        assert.ok(summary.completed >= 0 && summary.completed <= 8);
      });

      for (let i = 0; i < 1000; i++) {
        assert.doesNotThrow(() => {
          store.toggle('doc_study_plan');
        });
      }

      assert.strictEqual(listenerCount, 1000);
      assert.strictEqual(store.isChecked('doc_study_plan'), false);
      assert.strictEqual(store.getCompletedCount(), 2);
    });

    test('3.3 1,000 rapid toggles under hostile Proxy storage throwing TypeError', () => {
      const hostileStorage = new Proxy({}, {
        get(target, prop) {
          if (prop === 'getItem') return () => null;
          if (prop === 'setItem') {
            return () => {
              throw new TypeError('Proxy storage write violation');
            };
          }
          return undefined;
        },
      });

      const store = new ChecklistStore(CHECKLIST_ITEMS, hostileStorage);

      for (let i = 0; i < 1000; i++) {
        assert.doesNotThrow(() => {
          store.toggle('doc_police_clearance');
        });
      }

      assert.strictEqual(store.isChecked('doc_police_clearance'), false);
      assert.strictEqual(store.getCompletedCount(), 2);
    });

    test('3.4 1,000 randomized multi-item toggles under failing storage verify invariants', () => {
      const failingStorage = {
        getItem() { return null; },
        setItem() {
          throw new Error('Disk unmounted / IO failure');
        },
      };

      const store = new ChecklistStore(CHECKLIST_ITEMS, failingStorage);
      const itemIds = CHECKLIST_ITEMS.map((item) => item.id);

      for (let i = 0; i < 1000; i++) {
        const randId = itemIds[Math.floor(Math.random() * itemIds.length)];
        const newVal = store.toggle(randId);
        assert.strictEqual(store.isChecked(randId), newVal);

        const summary = store.getSummary();
        assert.strictEqual(summary.total, 8);
        assert.strictEqual(summary.completed + (8 - summary.completed), 8);
        assert.ok(summary.percentage >= 0 && summary.percentage <= 100);
        assert.strictEqual(summary.percentage, Math.round((summary.completed / 8) * 100));
      }
    });
  });

  /* ========================================================================= */
  /* Task 4: Memory Fallback Isolation & Zero State Leakage Across Instances   */
  /* ========================================================================= */
  describe('Task 4: Cross-Instance Isolation & Zero State Leakage', () => {
    test('4.1 Failing instance write does NOT contaminate globalMemoryFallback', () => {
      resetGlobalMemoryFallback();
      assert.strictEqual(globalMemoryFallback.getItem(STORAGE_KEY), null);

      // Create an instance with failing custom storage
      const failingStorage = {
        getItem() { return null; },
        setItem() {
          throw new Error('QuotaExceededError: Custom storage write failure');
        },
      };

      const store1 = new ChecklistStore(CHECKLIST_ITEMS, failingStorage);
      store1.toggle('doc_financial');
      assert.strictEqual(store1.isChecked('doc_financial'), true);
      assert.strictEqual(store1.getCompletedCount(), 3);

      // Verify that globalMemoryFallback was NOT written to by store1.save()
      assert.strictEqual(
        globalMemoryFallback.getItem(STORAGE_KEY),
        null,
        'Failing store instance must not write or pollute globalMemoryFallback'
      );

      // Create fresh store instance relying on globalMemoryFallback
      const store2 = new ChecklistStore(CHECKLIST_ITEMS);
      assert.strictEqual(
        store2.isChecked('doc_financial'),
        false,
        'Store 2 must have baseline default state and not observe store 1 mutations'
      );
      assert.strictEqual(store2.getCompletedCount(), 2);
    });

    test('4.2 Distinct InMemoryStorage instances remain strictly isolated', () => {
      const storageA = new InMemoryStorage();
      const storageB = new InMemoryStorage();

      const storeA = new ChecklistStore(CHECKLIST_ITEMS, storageA);
      const storeB = new ChecklistStore(CHECKLIST_ITEMS, storageB);

      // Set all items in storeA to true
      CHECKLIST_ITEMS.forEach((it) => storeA.setChecked(it.id, true));
      assert.strictEqual(storeA.getCompletedCount(), 8);

      // storeB must remain at default 2 items
      assert.strictEqual(storeB.getCompletedCount(), 2);
      assert.strictEqual(storeB.isChecked('doc_language'), false);

      // Uncheck all items in storeB
      CHECKLIST_ITEMS.forEach((it) => storeB.setChecked(it.id, false));
      assert.strictEqual(storeB.getCompletedCount(), 0);

      // storeA must remain at 8 items
      assert.strictEqual(storeA.getCompletedCount(), 8);
    });

    test('4.3 resetGlobalMemoryFallback() restores default baseline state for future stores', () => {
      resetGlobalMemoryFallback();
      const s1 = new ChecklistStore();
      s1.setChecked('doc_recommendations', true);
      s1.setChecked('doc_study_plan', true);
      assert.strictEqual(s1.getCompletedCount(), 4);

      // Now reset the fallback
      resetGlobalMemoryFallback();

      const s2 = new ChecklistStore();
      assert.strictEqual(s2.getCompletedCount(), 2);
      assert.strictEqual(s2.isChecked('doc_recommendations'), false);
      assert.strictEqual(s2.isChecked('doc_study_plan'), false);
    });

    test('4.4 10 concurrent instances with separate storage backends running interleaved toggles', () => {
      const NUM_INSTANCES = 10;
      const instances = [];

      for (let i = 0; i < NUM_INSTANCES; i++) {
        instances.push({
          id: i,
          store: new ChecklistStore(CHECKLIST_ITEMS, new InMemoryStorage()),
          expectedChecked: new Set(['doc_passport', 'doc_transcripts']),
        });
      }

      // Interleave operations across instances
      const itemIds = CHECKLIST_ITEMS.map((item) => item.id);
      for (let round = 0; round < 100; round++) {
        for (const inst of instances) {
          const targetId = itemIds[(round + inst.id) % itemIds.length];
          const nextVal = inst.store.toggle(targetId);
          if (nextVal) {
            inst.expectedChecked.add(targetId);
          } else {
            inst.expectedChecked.delete(targetId);
          }
        }
      }

      // Verify each instance matches its exact expectedChecked set
      for (const inst of instances) {
        assert.strictEqual(inst.store.getCompletedCount(), inst.expectedChecked.size);
        for (const itemId of itemIds) {
          assert.strictEqual(
            inst.store.isChecked(itemId),
            inst.expectedChecked.has(itemId),
            `Instance ${inst.id} itemId ${itemId} state mismatch`
          );
        }
      }
    });
  });
});
