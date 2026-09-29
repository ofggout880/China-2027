/**
 * website/src/components/languageTimeline.js
 * Chinese Language Learning Roadmap & HSK 1-6 Milestone Timeline Component
 * Milestone: M3 (Roadmap Tools: Chinese Language Learning Timeline & HSK Tracker)
 * References:
 *   - ORIGINAL_REQUEST.md (R3: Language Timeline prior to September 2027; R4: Mobile-First)
 *   - PROJECT.md (Interface Contract 4: HSKMilestone; Feature 10 & 11)
 *   - tests/e2e/live-functional.spec.js (Test 07: Selector [data-timeline], .timeline-milestone, .hsk-card)
 *   - tests/e2e/run-all.mjs (Assertion 7: .timeline-milestone, .hsk-card, [data-hsk])
 *   - tests/unit/mobileCssAudit.test.mjs (Strict 0 max-width queries rule)
 */

import { hskMilestones, getHskSummary } from '../data/hskMilestones.js';
import { store } from '../store.js';
import { t } from '../i18n.js';

/**
 * Self-contained component CSS tokens and styles.
 * Ensures zero-configuration drop-in rendering while strictly obeying
 * mobile-first architecture (0 max-width queries, >= 44px tap targets).
 */
export const TIMELINE_STYLES = `
/* ==========================================================================
   CHINESE LANGUAGE TIMELINE & HSK ROADMAP COMPONENT STYLES
   Mobile-First Baseline (320px–639px), Progressive Min-Width Queries Only
   ========================================================================== */

.language-timeline-component {
  position: relative;
  width: 100%;
}

/* 1. Header & Vocabulary Metric Banner */
.timeline-hero-card {
  position: relative;
  background: var(--bg-card, #12151c);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-lg, 20px);
  padding: 1.25rem 1rem;
  box-shadow: var(--shadow-card);
  margin-bottom: 1.5rem;
  overflow: hidden;
  backdrop-filter: var(--backdrop-blur, blur(16px));
  -webkit-backdrop-filter: var(--backdrop-blur, blur(16px));
}

.timeline-hero-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-red-primary, #DE2910), var(--color-gold, #FFDE00), var(--color-red-vibrant, #FF2A4A));
}

.timeline-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.timeline-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: rgba(222, 41, 16, 0.15);
  border: 1px solid rgba(222, 41, 16, 0.4);
  border-radius: var(--radius-full, 9999px);
  color: var(--color-gold, #FFDE00);
  font-size: var(--text-xs, 0.75rem);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.timeline-intake-flag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-secondary, #9CA3AF);
  font-weight: 500;
}

.timeline-hero-title {
  font-size: clamp(1.25rem, 4vw, 1.85rem);
  font-weight: 800;
  color: var(--text-primary, #F3F4F6);
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin-bottom: 0.4rem;
}

.timeline-hero-desc {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-secondary, #9CA3AF);
  line-height: 1.55;
  margin-bottom: 1.25rem;
  max-width: 760px;
}

/* Vocabulary Progress Tracker */
.hsk-progress-box {
  background: rgba(10, 12, 16, 0.65);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 14px);
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.hsk-progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: var(--text-xs, 0.75rem);
}

.progress-label-main {
  color: var(--text-primary, #F3F4F6);
  font-weight: 700;
}

.progress-numbers {
  color: var(--color-gold, #FFDE00);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.hsk-progress-bar-bg {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
  position: relative;
}

.hsk-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-red-primary, #DE2910), var(--color-gold, #FFDE00));
  border-radius: var(--radius-full, 9999px);
  box-shadow: 0 0 10px rgba(255, 222, 0, 0.5);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 4 Quick Stat Counters */
.hsk-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.hsk-stat-card {
  background: rgba(18, 21, 28, 0.8);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 8px);
  padding: 0.75rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hsk-stat-val {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary, #F3F4F6);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.hsk-stat-val.gold {
  color: var(--color-gold, #FFDE00);
}

.hsk-stat-val.red {
  color: var(--color-red-vibrant, #FF2A4A);
}

.hsk-stat-lbl {
  font-size: 0.6875rem;
  color: var(--text-muted, #6B7280);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* 2. Interactive Filter Chips Bar */
.hsk-filters-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0 1.25rem 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.hsk-filters-bar::-webkit-scrollbar {
  display: none;
}

.hsk-filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 44px;
  min-width: 44px;
  padding: 0.5rem 0.875rem;
  background: rgba(18, 21, 28, 0.85);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-full, 9999px);
  color: var(--text-secondary, #9CA3AF);
  font-size: var(--text-xs, 0.75rem);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast, 150ms ease);
  touch-action: manipulation;
  user-select: none;
}

.hsk-filter-chip:hover {
  background: var(--bg-surface-elevated, #222836);
  color: var(--text-primary, #F3F4F6);
  border-color: rgba(255, 255, 255, 0.25);
}

.hsk-filter-chip.active {
  background: linear-gradient(135deg, rgba(222, 41, 16, 0.28), rgba(255, 42, 74, 0.18));
  border-color: var(--color-red-vibrant, #FF2A4A);
  color: #FFFFFF;
  box-shadow: 0 0 14px rgba(255, 42, 74, 0.3);
}

.chip-count {
  font-size: 0.65rem;
  background: rgba(255, 255, 255, 0.12);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-full, 9999px);
  font-weight: 700;
}

/* 3. Chronological Timeline Vertical Track */
.timeline-track-wrap {
  position: relative;
  padding-left: 2rem;
}

.timeline-spine-line {
  position: absolute;
  top: 1rem;
  bottom: 2rem;
  left: 11px;
  width: 2px;
  background: linear-gradient(180deg, var(--color-gold, #FFDE00) 0%, var(--color-red-primary, #DE2910) 30%, rgba(255, 42, 74, 0.4) 70%, rgba(255, 255, 255, 0.08) 100%);
  pointer-events: none;
}

.timeline-items-flow {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 4. Discrete Milestone Item & Card */
.timeline-item,
.timeline-milestone,
.hsk-card {
  position: relative;
  background: var(--bg-card, #12151c);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.12));
  border-radius: var(--radius-md, 14px);
  padding: 1.25rem 1rem;
  box-shadow: var(--shadow-card);
  transition: transform var(--transition-normal, 250ms ease),
              border-color var(--transition-normal, 250ms ease),
              box-shadow var(--transition-normal, 250ms ease);
  backdrop-filter: var(--backdrop-blur, blur(16px));
  -webkit-backdrop-filter: var(--backdrop-blur, blur(16px));
}

.timeline-item:hover {
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.7);
}

/* Left Node Marker on Spine */
.timeline-node-pin {
  position: absolute;
  top: 1.5rem;
  left: -2.35rem;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full, 9999px);
  background: #0a0c10;
  border: 2px solid var(--border-subtle, rgba(255, 255, 255, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-secondary, #9CA3AF);
  z-index: 2;
  transition: all var(--transition-normal);
}

/* Status: Completed */
.timeline-item.status-completed {
  border-left: 3px solid var(--color-gold, #FFDE00);
}

.timeline-item.status-completed .timeline-node-pin {
  background: var(--color-gold, #FFDE00);
  border-color: #FFFFFF;
  color: #000000;
  box-shadow: 0 0 12px rgba(255, 222, 0, 0.6);
}

/* Status: In Progress (Active Pulse) */
.timeline-item.status-in-progress {
  border-left: 3px solid var(--color-red-vibrant, #FF2A4A);
  background: linear-gradient(135deg, rgba(222, 41, 16, 0.08), rgba(18, 21, 28, 0.95));
  box-shadow: 0 4px 20px -2px rgba(255, 42, 74, 0.2);
}

.timeline-item.status-in-progress .timeline-node-pin {
  background: var(--color-red-vibrant, #FF2A4A);
  border-color: #FFFFFF;
  color: #FFFFFF;
  box-shadow: 0 0 16px var(--color-red-glow, rgba(255, 42, 74, 0.8));
  animation: pulseBeacon 2s infinite ease-in-out;
}

@keyframes pulseBeacon {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 42, 74, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(255, 42, 74, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 42, 74, 0);
  }
}

/* Status: Upcoming */
.timeline-item.status-upcoming {
  border-left: 3px solid rgba(255, 255, 255, 0.15);
  opacity: 0.92;
}

.timeline-item.status-upcoming .timeline-node-pin {
  background: #181d26;
  border-color: rgba(255, 255, 255, 0.25);
  color: var(--text-muted, #6B7280);
}

/* Milestone Card Header */
.hsk-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.hsk-level-cluster {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.hsk-level-badge {
  font-size: var(--text-base, 1rem);
  font-weight: 800;
  color: #FFFFFF;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-xs, 4px);
  background: linear-gradient(135deg, var(--color-red-primary, #DE2910), var(--color-red-vibrant, #FF2A4A));
  box-shadow: 0 2px 8px var(--color-red-glow, rgba(255, 42, 74, 0.3));
  letter-spacing: -0.01em;
}

.hsk-cefr-chip {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-gold, #FFDE00);
  background: rgba(255, 222, 0, 0.1);
  border: 1px solid rgba(255, 222, 0, 0.3);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-xs, 4px);
}

.hsk-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full, 9999px);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.hsk-status-pill.status-completed {
  background: rgba(16, 185, 129, 0.15);
  color: #34D399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.hsk-status-pill.status-in-progress {
  background: rgba(222, 41, 16, 0.2);
  color: #FFA39E;
  border: 1px solid var(--color-red-vibrant, #FF2A4A);
}

.hsk-status-pill.status-upcoming {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted, #6B7280);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Milestone Titles & Dates */
.hsk-card-title-group {
  margin-bottom: 0.65rem;
}

.hsk-card-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--text-primary, #F3F4F6);
  line-height: 1.3;
  margin-bottom: 0.15rem;
}

.hsk-card-title-zh {
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-gold-muted, #D4AF37);
  font-weight: 500;
}

.hsk-card-meta-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-muted, #6B7280);
  margin-bottom: 0.75rem;
}

.hsk-target-date {
  color: var(--color-gold, #FFDE00);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* Competency Statement */
.hsk-competency-text {
  font-size: 0.84rem;
  line-height: 1.5;
  color: var(--text-secondary, #9CA3AF);
  margin-bottom: 0.85rem;
}

/* Admission Threshold Callout Ribbon */
.hsk-admission-callout {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  background: rgba(222, 41, 16, 0.12);
  border: 1px solid rgba(222, 41, 16, 0.35);
  border-radius: var(--radius-sm, 8px);
  margin-bottom: 0.85rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #FFA39E;
}

.hsk-admission-callout .callout-star {
  color: var(--color-gold, #FFDE00);
  font-size: 0.875rem;
  flex-shrink: 0;
  line-height: 1;
}

/* Metrics Triplet Row */
.hsk-metrics-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
  margin-bottom: 0.85rem;
}

.hsk-metric-cell {
  background: rgba(10, 12, 16, 0.55);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: var(--radius-xs, 6px);
  padding: 0.5rem 0.35rem;
  text-align: center;
}

.cell-num {
  font-size: 0.9375rem;
  font-weight: 800;
  color: var(--text-primary, #F3F4F6);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.cell-lbl {
  font-size: 0.625rem;
  color: var(--text-muted, #6B7280);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 0.1rem;
}

/* Accordion Trigger & Expandable Section */
.hsk-accordion-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  border-radius: var(--radius-sm, 8px);
  color: var(--text-primary, #F3F4F6);
  font-size: var(--text-xs, 0.75rem);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast, 150ms ease);
  touch-action: manipulation;
}

.hsk-accordion-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.toggle-arrow {
  width: 14px;
  height: 14px;
  transition: transform 0.25s ease;
}

.hsk-accordion-toggle[aria-expanded="true"] .toggle-arrow {
  transform: rotate(180deg);
}

.hsk-accordion-drawer {
  display: none;
  padding-top: 1rem;
  border-top: 1px dashed var(--border-subtle, rgba(255, 255, 255, 0.1));
  margin-top: 0.85rem;
  animation: fadeIn 200ms ease forwards;
}

.hsk-accordion-drawer.is-open {
  display: block;
}

/* Sample Vocabulary Cards */
.drawer-section-title {
  font-size: var(--text-xs, 0.75rem);
  font-weight: 700;
  color: var(--color-gold, #FFDE00);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.sample-words-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.word-chip-card {
  display: flex;
  flex-direction: column;
  padding: 0.65rem 0.85rem;
  background: rgba(14, 18, 25, 0.9);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-sm, 8px);
  gap: 0.25rem;
  cursor: pointer;
  transition: all var(--transition-fast, 150ms ease);
}

.word-chip-card:hover {
  border-color: rgba(255, 222, 0, 0.4);
  background: rgba(22, 28, 38, 0.95);
  transform: translateY(-1px);
}

.word-top-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
}

.word-hanzi {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary, #F3F4F6);
  letter-spacing: 0.05em;
}

.word-pinyin {
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-gold, #FFDE00);
  font-family: var(--font-mono, monospace);
}

.word-trans {
  font-size: 0.8125rem;
  color: var(--text-secondary, #9CA3AF);
}

.word-example {
  font-size: 0.75rem;
  color: var(--text-muted, #6B7280);
  font-style: italic;
  margin-top: 0.2rem;
  border-left: 2px solid var(--color-red-primary, #DE2910);
  padding-left: 0.4rem;
}

/* Resources List */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: var(--text-xs, 0.75rem);
  color: var(--text-secondary, #9CA3AF);
}

.resource-bullet {
  color: var(--color-red-vibrant, #FF2A4A);
  font-size: 0.75rem;
}

/* 5. Detail Modal Component */
.hsk-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: var(--z-modal, 1000);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}

.hsk-modal-backdrop.is-open {
  opacity: 1;
  pointer-events: auto;
}

.hsk-modal-dialog {
  background: var(--bg-card, #12151c);
  border: 1px solid var(--border-card, rgba(255, 255, 255, 0.18));
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 16px 48px -8px rgba(0, 0, 0, 0.85), 0 0 24px rgba(222, 41, 16, 0.25);
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
  transform: translateY(20px);
  transition: transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.hsk-modal-backdrop.is-open .hsk-modal-dialog {
  transform: translateY(0);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
}

.modal-close-btn {
  background: transparent;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.15));
  border-radius: var(--radius-sm, 8px);
  color: var(--text-secondary, #9CA3AF);
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast, 150ms ease);
}

.modal-close-btn:hover {
  color: #FFFFFF;
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.08);
}

/* ==========================================================================
   PROGRESSIVE ENHANCEMENT: MIN-WIDTH MEDIA QUERIES ONLY (0 max-width)
   ========================================================================== */

/* Small Tablets / Large Phones Landscape (>= 640px) */
@media (min-width: 640px) {
  .timeline-hero-card {
    padding: 1.75rem 1.5rem;
  }

  .hsk-summary-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .sample-words-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablets & Desktop Viewports (>= 768px) */
@media (min-width: 768px) {
  .timeline-track-wrap {
    padding-left: 2.5rem;
  }

  .timeline-spine-line {
    left: 15px;
  }

  .timeline-node-pin {
    width: 28px;
    height: 28px;
    left: -2.85rem;
    font-size: 0.75rem;
  }

  .timeline-item,
  .timeline-milestone,
  .hsk-card {
    padding: 1.5rem;
  }

  .hsk-card-title {
    font-size: 1.25rem;
  }

  .hsk-metrics-row {
    gap: 0.75rem;
  }

  .cell-num {
    font-size: 1.15rem;
  }
}

/* Wide Desktop Screens (>= 1024px) */
@media (min-width: 1024px) {
  .timeline-hero-card {
    padding: 2rem;
  }
}
`;

/**
 * Injects component styles once into <head> with id="hsk-timeline-styles"
 */
export function ensureTimelineStyles() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('hsk-timeline-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'hsk-timeline-styles';
    styleEl.textContent = TIMELINE_STYLES;
    document.head.appendChild(styleEl);
  }
}

/**
 * Render single HSK milestone card
 * Meets E2E selector requirements: .timeline-item, .timeline-milestone, .hsk-card, [data-hsk]
 * @param {Object} milestone
 * @param {boolean} isExpanded
 * @returns {string} HTML string
 */
export function renderMilestoneCard(milestone, isExpanded = false) {
  if (!milestone) return '';

  const {
    id,
    level,
    title,
    titleZh,
    targetDate,
    vocabCount,
    characterCount,
    studyHours,
    competency,
    cefrEquivalent,
    status,
    statusLabel,
    isAdmissionThreshold,
    admissionNote,
    recommendedResources = [],
    sampleWords = []
  } = milestone;

  // Format node pin content: checkmark for completed, pulse dot for in-progress, level number for upcoming
  let pinContent = '';
  if (status === 'completed') {
    pinContent = '✓';
  } else if (status === 'in-progress') {
    pinContent = '●';
  } else {
    pinContent = level.replace(/[^0-9]/g, '') || '•';
  }

  const sampleWordsHtml = sampleWords.map((w) => `
    <div class="word-chip-card" data-hanzi="${w.hanzi}" role="button" tabindex="0" aria-label="${w.hanzi} (${w.pinyin}): ${w.translation}">
      <div class="word-top-row">
        <span class="word-hanzi">${w.hanzi}</span>
        <span class="word-pinyin">${w.pinyin}</span>
      </div>
      <div class="word-trans">${w.translation}</div>
      ${w.exampleZh ? `<div class="word-example">${w.exampleZh}</div>` : ''}
    </div>
  `).join('');

  const resourcesHtml = recommendedResources.map((res) => `
    <div class="resource-item">
      <span class="resource-bullet">▪</span>
      <span>${res}</span>
    </div>
  `).join('');

  return `
    <article 
      class="timeline-item timeline-milestone hsk-card status-${status}" 
      id="card-${id}" 
      data-hsk="${id}"
      data-level="${level}"
      data-status="${status}"
      role="article" 
      aria-label="${level}: ${title} (${statusLabel})"
    >
      <!-- Timeline Node Marker Pin -->
      <div class="timeline-node-pin" aria-hidden="true">${pinContent}</div>

      <!-- Card Header -->
      <div class="hsk-card-header">
        <div class="hsk-level-cluster">
          <span class="hsk-level-badge">${level}</span>
          ${cefrEquivalent ? `<span class="hsk-cefr-chip">${cefrEquivalent}</span>` : ''}
        </div>
        <span class="hsk-status-pill status-${status}">${statusLabel}</span>
      </div>

      <!-- Title & Target Date -->
      <div class="hsk-card-title-group">
        <h3 class="hsk-card-title">${title}</h3>
        ${titleZh ? `<div class="hsk-card-title-zh">${titleZh}</div>` : ''}
      </div>

      <div class="hsk-card-meta-row">
        <span class="hsk-target-date">
          <span aria-hidden="true">📅</span>
          <span>Target: ${targetDate}</span>
        </span>
      </div>

      <!-- Competency Description -->
      <p class="hsk-competency-text">${competency}</p>

      <!-- Admission Threshold Callout (HSK 4 & 5) -->
      ${isAdmissionThreshold ? `
        <div class="hsk-admission-callout" role="note">
          <span class="callout-star" aria-hidden="true">★</span>
          <span><strong>Admission Benchmark:</strong> ${admissionNote}</span>
        </div>
      ` : ''}

      <!-- Metrics Triplet -->
      <div class="hsk-metrics-row">
        <div class="hsk-metric-cell">
          <div class="cell-num">${vocabCount.toLocaleString()}</div>
          <div class="cell-lbl">Vocab Words</div>
        </div>
        <div class="hsk-metric-cell">
          <div class="cell-num">${characterCount.toLocaleString()}</div>
          <div class="cell-lbl">Hanzi Chars</div>
        </div>
        <div class="hsk-metric-cell">
          <div class="cell-num">${studyHours}</div>
          <div class="cell-lbl">Study Hours</div>
        </div>
      </div>

      <!-- Expandable Accordion Toggle -->
      <button 
        type="button" 
        class="hsk-accordion-toggle" 
        data-toggle-target="drawer-${id}"
        aria-expanded="${isExpanded ? 'true' : 'false'}"
        aria-controls="drawer-${id}"
      >
        <span>View Vocabulary & Resources (${sampleWords.length} words)</span>
        <svg class="toggle-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <!-- Expandable Drawer Content -->
      <div id="drawer-${id}" class="hsk-accordion-drawer ${isExpanded ? 'is-open' : ''}">
        <div class="drawer-section-title">
          <span aria-hidden="true">🀄</span>
          <span>Core Sample Vocabulary</span>
        </div>
        <div class="sample-words-grid">
          ${sampleWordsHtml}
        </div>

        <div class="drawer-section-title">
          <span aria-hidden="true">📚</span>
          <span>Recommended Study Resources</span>
        </div>
        <div class="resources-list">
          ${resourcesHtml}
        </div>
      </div>
    </article>
  `.trim();
}

/**
 * Render Header and Vocabulary Progress Summary Card
 * @param {Object} summary
 * @returns {string} HTML string
 */
export function renderTimelineHero(summary = getHskSummary()) {
  const activeProfId = (store && store.getState().activeProfile) || 'matthieu';
  const isAgathe = activeProfId === 'agathe';
  const profName = isAgathe ? 'Agathe' : 'Matthieu';
  const profAvatar = isAgathe ? '👧' : '👦';
  const otherName = isAgathe ? 'Matthieu' : 'Agathe';
  const otherAvatar = isAgathe ? '👦' : '👧';
  const otherId = isAgathe ? 'matthieu' : 'agathe';
  const isFr = store && store.getState().language === 'fr';
  const targetHsk = isAgathe ? 'HSK 4/5 (Management & Bilingue)' : 'HSK 5/6 (Ingénierie & Master C9)';

  const {
    totalMilestones,
    completedCount,
    inProgressLevel,
    currentVocab,
    totalVocabTarget,
    totalCharactersTarget,
    progressPercent
  } = summary;

  return `
    <!-- Candidate Profile Workspace Banner -->
    <div class="candidate-workspace-banner" style="margin-bottom: 1.5rem;">
      <div class="candidate-info-group">
        <span class="candidate-avatar">${profAvatar}</span>
        <div class="candidate-meta">
          <span class="candidate-name">${t('Candidate Workspace:')} ${profName}</span>
          <span class="candidate-track">${t('Target Level:')} ${targetHsk}</span>
        </div>
      </div>
      <button type="button" class="candidate-switch-link" data-profile="${otherId}">
        <span>${t(isAgathe ? 'Switch to Matthieu' : 'Switch to Agathe')}</span>
        <span>${otherAvatar}</span>
      </button>
    </div>

    <header class="timeline-hero-card">
      <div class="timeline-badge-row">
        <div class="timeline-tag">
          <span aria-hidden="true">★</span>
          <span>Chinese Language Proficiency Roadmap</span>
        </div>
        <div class="timeline-intake-flag">
          <span>Target Deadline: September 2027</span>
        </div>
      </div>

      <h2 class="timeline-hero-title">
        HSK 1 to 6 <span class="text-red">Language Milestones</span>
      </h2>
      <p class="timeline-hero-desc">
        A structured, chronological Mandarin study pathway from Q4 2026 to Fall 2027 university enrollment. Track your cumulative vocabulary, character retention, and official admission benchmarks.
      </p>

      <!-- Cumulative Progress Bar -->
      <div class="hsk-progress-box">
        <div class="hsk-progress-meta">
          <span class="progress-label-main">Roadmap Progress to HSK 6 Mastery</span>
          <span class="progress-numbers">${currentVocab.toLocaleString()} / ${totalVocabTarget.toLocaleString()} Words (${progressPercent}%)</span>
        </div>
        <div class="hsk-progress-bar-bg" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
          <div class="hsk-progress-bar-fill" style="width: ${progressPercent}%"></div>
        </div>
      </div>

      <!-- 4 Quick Stats -->
      <div class="hsk-summary-grid">
        <div class="hsk-stat-card">
          <span class="hsk-stat-val gold">${completedCount} of ${totalMilestones}</span>
          <span class="hsk-stat-lbl">Levels Completed</span>
        </div>
        <div class="hsk-stat-card">
          <span class="hsk-stat-val red">${inProgressLevel}</span>
          <span class="hsk-stat-lbl">Current Focus</span>
        </div>
        <div class="hsk-stat-card">
          <span class="hsk-stat-val">${totalCharactersTarget.toLocaleString()}</span>
          <span class="hsk-stat-lbl">Total Hanzi Target</span>
        </div>
        <div class="hsk-stat-card">
          <span class="hsk-stat-val gold">HSK 4 & 5</span>
          <span class="hsk-stat-lbl">${t('Admissions Benchmark')}</span>
        </div>
      </div>
    </header>
  `.trim();
}

/**
 * Render filter chips for HSK levels and completion status
 * @param {Array} milestones
 * @param {string} currentFilter
 * @returns {string} HTML string
 */
export function renderFilterChips(milestones = hskMilestones, currentFilter = 'all') {
  const activeFilter = String(currentFilter || 'all').toLowerCase();

  const filterOptions = [
    { id: 'all', label: t('All Levels'), count: milestones.length },
    { id: 'completed', label: t('Completed'), count: milestones.filter((m) => m.status === 'completed').length },
    { id: 'in-progress', label: t('In Progress'), count: milestones.filter((m) => m.status === 'in-progress').length },
    { id: 'upcoming', label: t('Upcoming'), count: milestones.filter((m) => m.status === 'upcoming').length },
    { id: 'hsk1', label: 'HSK 1', count: 1 },
    { id: 'hsk2', label: 'HSK 2', count: 1 },
    { id: 'hsk3', label: 'HSK 3', count: 1 },
    { id: 'hsk4', label: 'HSK 4', count: 1 },
    { id: 'hsk5', label: 'HSK 5', count: 1 },
    { id: 'hsk6', label: 'HSK 6', count: 1 }
  ];

  return `
    <nav class="hsk-filters-bar" role="tablist" aria-label="HSK Level Filters">
      ${filterOptions.map((opt) => `
        <button 
          type="button" 
          class="hsk-filter-chip ${activeFilter === opt.id ? 'active' : ''}" 
          data-filter="${opt.id}"
          role="tab"
          aria-selected="${activeFilter === opt.id ? 'true' : 'false'}"
          aria-label="Filter ${opt.label} (${opt.count})"
        >
          <span>${opt.label}</span>
          <span class="chip-count">${opt.count}</span>
        </button>
      `).join('')}
    </nav>
  `.trim();
}

/**
 * Render the complete language timeline component HTML
 * @param {Array} [milestones=hskMilestones]
 * @param {string} [currentFilter='all']
 * @returns {string} HTML string
 */
export function renderLanguageTimeline(milestones = hskMilestones, currentFilter = 'all') {
  const summary = getHskSummary(milestones);
  const activeFilter = String(currentFilter || 'all').toLowerCase();

  const filteredMilestones = milestones.filter((m) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed' || activeFilter === 'in-progress' || activeFilter === 'upcoming') {
      return m.status === activeFilter;
    }
    return m.id === activeFilter || m.level.toLowerCase().replace(/\s+/g, '') === activeFilter;
  });

  const cardsHtml = filteredMilestones.map((m) => renderMilestoneCard(m)).join('\n');

  return `
    <section class="language-timeline-component" id="language-timeline" data-timeline="true" aria-label="Chinese Language Learning Timeline">
      <!-- Top Hero & Progress Summary -->
      ${renderTimelineHero(summary)}

      <!-- Interactive Filter Bar -->
      ${renderFilterChips(milestones, activeFilter)}

      <!-- Timeline Track with Connecting Spine -->
      <div class="timeline-track-wrap">
        <div class="timeline-spine-line" aria-hidden="true"></div>
        <div class="timeline-items-flow" role="feed" aria-busy="false">
          ${cardsHtml}
        </div>
      </div>
    </section>
  `.trim();
}

/**
 * Mount the Language Timeline component into the DOM
 * Handles mounting into #language-timeline-container, any container element, or by selector.
 *
 * @param {HTMLElement|string} [target] Container element or CSS selector
 * @param {Array} [milestones=hskMilestones]
 * @returns {HTMLElement|null}
 */
export function mountLanguageTimeline(target, milestones = hskMilestones) {
  ensureTimelineStyles();

  let container = null;
  if (typeof target === 'string') {
    container = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    container = target;
  } else {
    container = document.getElementById('language-timeline-container');
  }

  if (!container) {
    console.warn('[languageTimeline] Target container element not found for mount.');
    return null;
  }

  // Read initial filter from store if available
  const initialFilter = (store && store.getState) ? store.getState().selectedHskLevel || 'all' : 'all';

  // Render initial view
  container.innerHTML = renderLanguageTimeline(milestones, initialFilter);
  attachTimelineEvents(container, milestones);

  // Subscribe to store filter changes if store is present
  if (store && store.subscribeKey) {
    store.subscribeKey('selectedHskLevel', (newFilter) => {
      const activeFilter = newFilter || 'all';
      updateFilterDOM(container, milestones, activeFilter);
    });
  }

  return container;
}

/**
 * Update the timeline cards and filter chips without full DOM teardown
 */
function updateFilterDOM(container, milestones, activeFilter) {
  if (!container) return;

  // Update active state on filter chips
  const chips = container.querySelectorAll('.hsk-filter-chip');
  chips.forEach((chip) => {
    const isTarget = chip.dataset.filter === activeFilter;
    chip.classList.toggle('active', isTarget);
    chip.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  // Filter and update cards list
  const flowContainer = container.querySelector('.timeline-items-flow');
  if (flowContainer) {
    const filtered = milestones.filter((m) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'completed' || activeFilter === 'in-progress' || activeFilter === 'upcoming') {
        return m.status === activeFilter;
      }
      return m.id === activeFilter || m.level.toLowerCase().replace(/\s+/g, '') === activeFilter;
    });

    flowContainer.innerHTML = filtered.map((m) => renderMilestoneCard(m)).join('\n');
    attachAccordionEvents(flowContainer);
  }
}

/**
 * Attach interactive accordion toggles, filter clicks, and flashcard taps
 * @param {HTMLElement} rootElement
 * @param {Array} milestones
 */
function attachTimelineEvents(rootElement, milestones) {
  if (!rootElement) return;

  // 1. Filter Chips Click Listener
  rootElement.addEventListener('click', (e) => {
    const chip = e.target.closest('.hsk-filter-chip');
    if (chip) {
      e.preventDefault();
      const filter = chip.dataset.filter || 'all';
      if (store && store.setHskLevelFilter) {
        store.setHskLevelFilter(filter);
      } else {
        updateFilterDOM(rootElement, milestones, filter);
      }
      return;
    }

    // 2. Accordion Drawer Toggle
    const toggleBtn = e.target.closest('.hsk-accordion-toggle');
    if (toggleBtn) {
      e.preventDefault();
      const drawerId = toggleBtn.getAttribute('data-toggle-target');
      const drawer = rootElement.querySelector(`#${drawerId}`);
      if (drawer) {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
        drawer.classList.toggle('is-open', !isExpanded);
      }
      return;
    }

    // 3. Word Flashcard Click / Keyboard Feedback
    const wordCard = e.target.closest('.word-chip-card');
    if (wordCard) {
      wordCard.classList.add('card-tapped');
      setTimeout(() => wordCard.classList.remove('card-tapped'), 300);
    }
  });

  // Accessibility keyboard enter/space
  rootElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.classList.contains('hsk-accordion-toggle') || activeEl.classList.contains('hsk-filter-chip'))) {
        e.preventDefault();
        activeEl.click();
      }
    }
  });
}

function attachAccordionEvents(flowContainer) {
  // Event delegation on parent rootElement handles newly rendered cards automatically
}

export default {
  renderLanguageTimeline,
  renderMilestoneCard,
  renderTimelineHero,
  renderFilterChips,
  mountLanguageTimeline,
  ensureTimelineStyles,
  TIMELINE_STYLES
};
