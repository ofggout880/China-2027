/**
 * website/tests/unit/scrollProgress.test.mjs
 * Unit Test Suite for Magic UI ScrollProgress Component
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ScrollProgress, mountScrollProgress } from '../../src/components/ui/scroll-progress.js';

describe('Magic UI ScrollProgress Component Test Suite', () => {
  it('renders valid scroll progress bar HTML markup with default values', () => {
    const html = ScrollProgress();
    assert.ok(typeof html === 'string');
    assert.ok(html.includes('class="magic-scroll-progress "'));
    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes('aria-label="Scroll Progress"'));
    assert.ok(html.includes('aria-valuenow="0"'));
    assert.ok(html.includes('class="scroll-progress-fill"'));
    assert.ok(html.includes('id="magic-scroll-progress-fill"'));
  });

  it('renders custom className when provided', () => {
    const html = ScrollProgress({ className: 'custom-scroll-class' });
    assert.ok(html.includes('magic-scroll-progress custom-scroll-class'));
  });

  it('handles mount and cleanup gracefully in non-browser environments', () => {
    // In Node test environment, window is undefined or minimal
    const cleanup = mountScrollProgress();
    assert.ok(typeof cleanup === 'function');
    assert.doesNotThrow(() => cleanup());
  });
});
