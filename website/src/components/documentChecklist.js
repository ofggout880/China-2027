/**
 * src/components/documentChecklist.js
 * Application Document Checklist & Dossier Tracker for CHINA 2027
 * Features:
 * - 8 Critical Admission Documents with dual-language metadata
 * - Resilient LocalStorage persistence under key 'china2027_checklist_v1'
 * - In-Memory Fallback on QuotaExceededError or Security restrictions
 * - Interactive toggle, instant visual feedback, dynamic progress calculation
 * - Filter tabs (All, Completed, Pending, Required)
 * - Mobile-first layout with minimum 44px interactive tap targets
 */

import { checklistData as DEFAULT_ITEMS } from '../data/checklistData.js';
import { store } from '../store.js';
import { t } from '../i18n.js';

export const STORAGE_KEY = 'china2027_checklist_v1';

/**
 * Resilient In-Memory Storage Fallback
 * Used in private browsing mode, headless CI environments, or when storage quota is exhausted.
 */
export class InMemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

// Module-level shared in-memory fallback instance
export const globalMemoryFallback = new InMemoryStorage();

/**
 * Resets the shared in-memory fallback storage (useful for test isolation)
 */
export function resetGlobalMemoryFallback() {
  globalMemoryFallback.clear();
}

/**
 * Resolves safe storage backend (window.localStorage or InMemoryStorage)
 * Wrapped in try/catch to gracefully handle SecurityError in restricted environments
 * (e.g. private browsing mode, sandboxed iframes without allow-same-origin).
 */
export function resolveStorage(explicitStorage = null) {
  if (explicitStorage) return explicitStorage;

  if (typeof window !== 'undefined') {
    try {
      const storage = window.localStorage;
      if (storage) {
        // Test storage availability
        const testKey = '__storage_test__';
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return storage;
      }
    } catch {
      // Private mode, sandboxed iframe, or security restriction
      return globalMemoryFallback;
    }
  }

  return globalMemoryFallback;
}

/**
 * Checklist State Store with Quota & Security Resilience
 * Strictly complies with Interface Contract 3 and checklistStorage.test.mjs specification.
 */
export class ChecklistStore {
  constructor(items = DEFAULT_ITEMS, storage = null) {
    this.items = Array.isArray(items) && items.length > 0 ? items : DEFAULT_ITEMS;
    this.storage = resolveStorage(storage);
    this.state = new Map();
    this.listeners = new Set();
    this.filter = 'all'; // 'all' | 'pending' | 'completed'
    this.init();
  }

  getStorageKey() {
    const profileId = (typeof store !== 'undefined' && store && store.getState().activeProfile) || 'matthieu';
    return profileId === 'matthieu' ? STORAGE_KEY : `china2027_checklist_${profileId}`;
  }

  init() {
    // 1. Establish default baseline states
    this.items.forEach((item) => {
      this.state.set(item.id, Boolean(item.defaultCompleted));
    });

    // 2. Hydrate from storage if present
    try {
      const storageKey = this.getStorageKey();
      const raw = this.storage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Serialized as array of checked string IDs: ['doc_passport', 'doc_transcripts']
          this.items.forEach((item) => {
            this.state.set(item.id, parsed.includes(item.id));
          });
        } else if (parsed && typeof parsed === 'object') {
          // Serialized as key-value map: { [id]: boolean }
          Object.entries(parsed).forEach(([id, val]) => {
            if (this.state.has(id)) {
              this.state.set(id, Boolean(val));
            }
          });
        }
      }
    } catch (err) {
      // Corrupted JSON or storage access denial gracefully falls back to default values
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[checklist] Storage read warning (falling back to defaults):', err.message);
      }
    }
  }

  toggle(itemId) {
    if (!this.state.has(itemId)) return false;
    const nextVal = !this.state.get(itemId);
    this.state.set(itemId, nextVal);
    this.save();
    this.notify(itemId, nextVal);
    return nextVal;
  }

  setChecked(itemId, isChecked) {
    if (!this.state.has(itemId)) return;
    const boolVal = Boolean(isChecked);
    this.state.set(itemId, boolVal);
    this.save();
    this.notify(itemId, boolVal);
  }

  save() {
    try {
      const checkedIds = Array.from(this.state.entries())
        .filter(([, checked]) => checked)
        .map(([id]) => id);
      const storageKey = this.getStorageKey();
      this.storage.setItem(storageKey, JSON.stringify(checkedIds));
    } catch (err) {
      // QuotaExceededError or SecurityError caught gracefully; in-memory state remains operational
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[checklist] Storage write warning (persisting in-memory):', err.message);
      }
    }
  }

  reset() {
    this.items.forEach((item) => {
      this.state.set(item.id, Boolean(item.defaultCompleted));
    });
    this.save();
    this.notify('*', null);
  }

  getCompletedCount() {
    let count = 0;
    for (const val of this.state.values()) {
      if (val) count++;
    }
    return count;
  }

  getTotalCount() {
    return this.items.length;
  }

  getProgressPercentage() {
    if (this.items.length === 0) return 0;
    return Math.round((this.getCompletedCount() / this.getTotalCount()) * 100);
  }

  getSummary() {
    const completed = this.getCompletedCount();
    const total = this.getTotalCount();
    const percentage = this.getProgressPercentage();
    return {
      completed,
      total,
      percentage,
      formattedText: `${completed} of ${total} completed (${percentage}%)`,
    };
  }

  isChecked(itemId) {
    return Boolean(this.state.get(itemId));
  }

  getStateMap() {
    const obj = {};
    for (const [key, value] of this.state.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  setFilter(filterName) {
    this.filter = filterName;
    this.notify('filter', filterName);
  }

  getFilter() {
    return this.filter;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(itemId, nextVal) {
    for (const listener of this.listeners) {
      try {
        listener(itemId, nextVal, this.getSummary());
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[checklist] Listener execution error:', err);
        }
      }
    }
  }
}

/**
 * Helper to escape HTML characters preventing XSS
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Category Icon SVG Mapping
 */
function getCategoryIcon(iconType) {
  switch (iconType) {
    case 'passport':
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/></svg>`;
    case 'academic':
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
    case 'certificate':
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
    case 'letter':
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
    case 'document':
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
    case 'medical':
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
    case 'shield':
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    case 'bank':
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="12 3 20 10 4 10 12 3"/><line x1="6" y1="10" x2="6" y2="21"/><line x1="10" y1="10" x2="10" y2="21"/><line x1="14" y1="10" x2="14" y2="21"/><line x1="18" y1="10" x2="18" y2="21"/></svg>`;
    default:
      return `<svg class="checklist-type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>`;
  }
}

/**
 * Renders an individual checklist item row
 */
export function renderChecklistItem(item, isChecked = false) {
  const safeId = escapeHtml(item.id);
  const safeTitle = escapeHtml(item.title);
  const safeTitleZh = escapeHtml(item.titleZh || '');
  const safeCategory = escapeHtml(item.category || '');
  const safeDesc = escapeHtml(item.description || '');
  const safeRequiredFor = escapeHtml(item.requiredFor || '');
  const safeNotes = escapeHtml(item.notes || '');
  const safeDeadline = escapeHtml(item.deadline || '');
  const safeAgency = escapeHtml(item.agency || '');
  const iconSvg = getCategoryIcon(item.icon);

  return `
    <article 
      class="checklist-item card ${isChecked ? 'completed' : ''}" 
      data-checklist-item="${safeId}"
      data-category="${safeCategory}"
      id="item-${safeId}"
    >
      <div class="checklist-item-content">
        <!-- Interactive Checkbox Control (Tap target strictly >= 48px) -->
        <label class="checklist-control" for="check-${safeId}" title="Toggle ${safeTitle}">
          <input 
            type="checkbox" 
            id="check-${safeId}" 
            class="checklist-checkbox" 
            data-id="${safeId}"
            data-checklist-checkbox="true"
            ${isChecked ? 'checked' : ''}
            aria-label="${safeTitle}"
          />
          <span class="custom-checkbox" aria-hidden="true">
            <svg class="check-icon" viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/>
            </svg>
          </span>
        </label>

        <!-- Document Details -->
        <div class="checklist-info">
          <div class="checklist-header-line">
            <div class="checklist-title-group">
              <span class="checklist-icon-wrap" aria-hidden="true">${iconSvg}</span>
              <h4 class="checklist-item-title">${safeTitle}</h4>
              ${safeTitleZh ? `<span class="checklist-item-zh">${safeTitleZh}</span>` : ''}
            </div>
            <div class="checklist-badges">
              <span class="badge badge-category">${safeCategory}</span>
              <span class="badge ${isChecked ? 'badge-completed' : 'badge-pending'}">
                ${isChecked ? 'Ready' : 'Pending'}
              </span>
            </div>
          </div>

          <p class="checklist-desc">${safeDesc}</p>

          <!-- Collapsible / Expanded Metadata Drawer -->
          <div class="checklist-meta-drawer">
            <div class="meta-row">
              <span class="meta-label">Required For:</span>
              <span class="meta-value">${safeRequiredFor}</span>
            </div>
            ${safeNotes ? `
              <div class="meta-row">
                <span class="meta-label">Crucial Guidance:</span>
                <span class="meta-value text-accent-gold">${safeNotes}</span>
              </div>` : ''}
            <div class="meta-footer">
              ${safeAgency ? `<span class="meta-chip">Issuer: ${safeAgency}</span>` : ''}
              ${safeDeadline ? `<span class="meta-chip chip-deadline">Target: ${safeDeadline}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * Renders the top progress bar and summary header
 */
export function renderChecklistProgress(summary) {
  const { completed, total, percentage, formattedText } = summary;
  const activeProfId = (typeof store !== 'undefined' && store && store.getState().activeProfile) || 'matthieu';
  const isAgathe = activeProfId === 'agathe';
  const profName = isAgathe ? 'Agathe' : 'Matthieu';
  const profAvatar = isAgathe ? '👧' : '👦';
  const otherName = isAgathe ? 'Matthieu' : 'Agathe';
  const otherAvatar = isAgathe ? '👦' : '👧';
  const otherId = isAgathe ? 'matthieu' : 'agathe';
  const isFr = typeof store !== 'undefined' && store && store.getState().language === 'fr';
  const profTrack = isAgathe ? (isFr ? 'Management & Bourses Universitaires' : 'Management & University Scholarships') : (isFr ? 'Ingénierie & Bourse CSC Haute Distinction' : 'Engineering & CSC High-Level Scholarship');

  return `
    <!-- Candidate Profile Workspace Banner -->
    <div class="candidate-workspace-banner" style="margin-bottom: 1.5rem;">
      <div class="candidate-info-group">
        <span class="candidate-avatar">${profAvatar}</span>
        <div class="candidate-meta">
          <span class="candidate-name">${t('Candidate Workspace:')} ${profName}</span>
          <span class="candidate-track">${t('Target Track:')} ${profTrack} · ${completed}/${total} ${isFr ? 'documents prêts' : 'documents ready'}</span>
        </div>
      </div>
      <button type="button" class="candidate-switch-link" data-profile="${otherId}">
        <span>${t(isAgathe ? 'Switch to Matthieu' : 'Switch to Agathe')}</span>
        <span>${otherAvatar}</span>
      </button>
    </div>

    <div class="checklist-progress-card card" id="checklist-progress-widget">
      <div class="progress-header">
        <div class="progress-title-wrap">
          <div class="card-badge"><span class="badge-dot"></span> ${t('Dossier Readiness Tracker')}</div>
          <h3 class="progress-headline">Application Document Checklist</h3>
          <p class="progress-sub">${t('8 Verified Official Admission & CSC Scholarship Documents (Intake Sept 2027)')}</p>
        </div>
        <div class="progress-stat-pill">
          <span class="stat-number checklist-counter" data-checklist-counter="true" id="checklist-counter-display">${formattedText}</span>
          <span class="stat-badge ${percentage === 100 ? 'status-complete' : 'status-ongoing'}">
            ${percentage === 100 ? t('All Documents Ready') : `${8 - completed}${t(' Remaining')}`}
          </span>
        </div>
      </div>

      <!-- Accessible Progress Bar -->
      <div 
        class="checklist-progress-wrap" 
        role="progressbar" 
        aria-valuenow="${percentage}" 
        aria-valuemin="0" 
        aria-valuemax="100" 
        aria-label="Application Document Preparation Progress"
      >
        <div 
          class="checklist-progress-bar" 
          id="checklist-progress-fill" 
          style="width: ${percentage}%"
        ></div>
      </div>

      <!-- Action Toolbar & Quick Filter Chips -->
      <div class="checklist-toolbar">
        <div class="filter-chips-group" role="tablist" aria-label="Filter documents">
          <button type="button" class="filter-chip active" data-filter="all">${t('All (8)')}</button>
          <button type="button" class="filter-chip" data-filter="pending">Pending</button>
          <button type="button" class="filter-chip" data-filter="completed">Ready</button>
        </div>
        <button 
          type="button" 
          class="btn-reset-checklist btn-ghost" 
          id="btn-reset-checklist"
          data-action="reset-checklist"
          title="Restore default dossier selection"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          ${t('Reset Defaults')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Pure HTML string renderer for complete Document Checklist section
 */
export function renderDocumentChecklist(items = DEFAULT_ITEMS, storeInstance = null) {
  const store = storeInstance || new ChecklistStore(items);
  const summary = store.getSummary();
  const currentFilter = store.getFilter();

  const itemsHtml = items
    .filter((item) => {
      const checked = store.isChecked(item.id);
      if (currentFilter === 'completed') return checked;
      if (currentFilter === 'pending') return !checked;
      return true;
    })
    .map((item) => renderChecklistItem(item, store.isChecked(item.id)))
    .join('');

  return `
    <section class="checklist-section" id="checklist" data-testid="checklist-section">
      ${renderChecklistProgress(summary)}
      <div class="checklist-items-grid" id="checklist-items-container">
        ${itemsHtml}
      </div>
    </section>
  `;
}

/**
 * Mounts interactive Document Checklist into DOM container and attaches event handlers.
 * @param {HTMLElement} container - Target DOM element (e.g. #document-checklist-container)
 * @param {Object} options - Configuration options { items, storage, onToggle }
 * @returns {ChecklistStore} Initialized store instance
 */
export function mountDocumentChecklist(container, options = {}) {
  if (!container) return null;

  const items = options.items || DEFAULT_ITEMS;
  const store = options.store || new ChecklistStore(items, options.storage);

  // Initial render
  container.innerHTML = renderDocumentChecklist(items, store);

  // Setup DOM event listeners
  setupChecklistEvents(container, store, options.onToggle);

  return store;
}

/**
 * Attaches robust event delegation to interactive checklist elements.
 */
export function setupChecklistEvents(container, store, onToggleCallback = null) {
  if (!container || !store) return;

  // 1. Delegated Change / Click for Checkboxes
  container.addEventListener('change', (e) => {
    const checkbox = e.target.closest('.checklist-checkbox, input[type="checkbox"]');
    if (!checkbox) return;

    const itemId = checkbox.getAttribute('data-id') || checkbox.id.replace('check-', '');
    if (!itemId) return;

    const isChecked = checkbox.checked;
    store.setChecked(itemId, isChecked);

    // Update parent card styling
    const itemCard = container.querySelector(`[data-checklist-item="${itemId}"]`);
    if (itemCard) {
      itemCard.classList.toggle('completed', isChecked);
      const statusBadge = itemCard.querySelector('.badge-completed, .badge-pending');
      if (statusBadge) {
        statusBadge.className = `badge ${isChecked ? 'badge-completed' : 'badge-pending'}`;
        statusBadge.textContent = isChecked ? t('Ready') : t('Pending');
      }
    }

    // Update progress bar and text summary
    updateProgressUI(container, store.getSummary());

    if (typeof onToggleCallback === 'function') {
      onToggleCallback(itemId, isChecked, store.getSummary());
    }
  });

  // 2. Delegated Filter Chips
  container.addEventListener('click', (e) => {
    const filterBtn = e.target.closest('.filter-chip');
    if (filterBtn) {
      const filter = filterBtn.dataset.filter || 'all';
      container.querySelectorAll('.filter-chip').forEach((btn) => btn.classList.remove('active'));
      filterBtn.classList.add('active');

      // Filter visible items
      const items = container.querySelectorAll('.checklist-item');
      items.forEach((itemEl) => {
        const isCompleted = itemEl.classList.contains('completed');
        if (filter === 'all') {
          itemEl.style.display = 'block';
        } else if (filter === 'completed') {
          itemEl.style.display = isCompleted ? 'block' : 'none';
        } else if (filter === 'pending') {
          itemEl.style.display = !isCompleted ? 'block' : 'none';
        }
      });
      return;
    }

    // 3. Reset Button Action
    const resetBtn = e.target.closest('.btn-reset-checklist, [data-action="reset-checklist"]');
    if (resetBtn) {
      e.preventDefault();
      store.reset();
      // Re-render items to reflect restored state
      container.innerHTML = renderDocumentChecklist(store.items, store);
      setupChecklistEvents(container, store, onToggleCallback);
      return;
    }
  });

  // 3. Subscribe store notifications to sync DOM
  store.subscribe((itemId, nextVal, summary) => {
    updateProgressUI(container, summary);
  });
}

/**
 * Updates DOM progress bar and counter without full re-render
 */
function updateProgressUI(container, summary) {
  if (!container || !summary) return;

  const progressBar = container.querySelector('#checklist-progress-fill, .checklist-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${summary.percentage}%`;
    const progressWrap = progressBar.closest('[role="progressbar"]');
    if (progressWrap) {
      progressWrap.setAttribute('aria-valuenow', String(summary.percentage));
    }
  }

  const counterEl = container.querySelector('#checklist-counter-display, .checklist-counter, [data-checklist-counter]');
  if (counterEl) {
    counterEl.textContent = summary.formattedText;
  }

  const statBadge = container.querySelector('.progress-stat-pill .stat-badge');
  if (statBadge) {
    const isAll = summary.percentage === 100;
    statBadge.className = `stat-badge ${isAll ? 'status-complete' : 'status-ongoing'}`;
    statBadge.textContent = isAll ? t('All Documents Ready') : `${summary.total - summary.completed}${t(' Remaining')}`;
  }
}

export default mountDocumentChecklist;
