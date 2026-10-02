/**
 * src/components/navigation.js
 * Responsive Navigation System: Mobile Bottom Tab Bar & Desktop Top Header
 */
import { store } from '../store.js';
import { t } from '../i18n.js';
import { ScrollProgress } from './ui/scroll-progress.js';

export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelZh: '概览',
    icon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`
  },
  {
    id: 'schools',
    label: 'Schools',
    labelZh: '院校',
    icon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
  },
  {
    id: 'timeline',
    label: 'Timeline',
    labelZh: '时间线',
    icon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
  },
  {
    id: 'checklist',
    label: 'Checklist',
    labelZh: '清单',
    icon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
  }
];

export function renderTopHeader() {
  const currentTab = store.getState().activeTab;
  return `
    <div class="header-container">
      <div class="brand-group brand" data-nav="dashboard" role="button" tabindex="0" aria-label="Go to Dashboard">
        <div class="brand-logo-icon">
          <svg viewBox="0 0 32 32" class="flag-icon" fill="currentColor" aria-hidden="true">
            <rect width="32" height="32" rx="6" fill="#DE2910"/>
            <polygon points="10,6 11.5,10.5 16,10.5 12.5,13 14,17.5 10,14.5 6,17.5 7.5,13 4,10.5 8.5,10.5" fill="#FFDE00"/>
            <circle cx="19" cy="8" r="1.2" fill="#FFDE00"/>
            <circle cx="22" cy="11" r="1.2" fill="#FFDE00"/>
            <circle cx="22" cy="15" r="1.2" fill="#FFDE00"/>
            <circle cx="19" cy="18" r="1.2" fill="#FFDE00"/>
          </svg>
        </div>
      </div>

      <!-- Desktop Nav Tabs (Hidden on mobile via CSS) -->
      <nav class="desktop-nav" role="tablist" aria-label="Desktop Navigation">
        ${NAV_ITEMS.map(
          (item) => `
          <button 
            type="button"
            class="desktop-nav-tab nav-tab ${currentTab === item.id ? 'active' : ''}"
            role="tab"
            data-tab="${item.id}"
            data-testid="tab-${item.id}"
            aria-selected="${currentTab === item.id ? 'true' : 'false'}"
            aria-controls="view-${item.id}"
          >
            ${item.icon}
            <span class="tab-label">${t(item.label)}</span>
            <span class="tab-label-zh">${item.labelZh}</span>
          </button>
        `
        ).join('')}
      </nav>

      <!-- Header Right Badges -->
      <div class="header-actions">
        <!-- Duo Profile Switcher -->
        <div class="profile-switcher-pill" role="group" aria-label="Candidate Profile">
          <button type="button" class="profile-btn ${store.getState().activeProfile === 'matthieu' ? 'active' : ''}" data-profile="matthieu" aria-label="Espace Matthieu">
            <span class="profile-name-text">Matthieu</span>
          </button>
          <button type="button" class="profile-btn ${store.getState().activeProfile === 'agathe' ? 'active' : ''}" data-profile="agathe" aria-label="Espace Agathe">
            <span class="profile-name-text">Agathe</span>
          </button>
        </div>

        <button id="lang-toggle-btn" class="btn btn-secondary lang-glass-btn" aria-label="Toggle Language">
          ${store.getState().language === 'fr' ? 'FR' : 'EN'}
        </button>

        <!-- Burger Menu Toggle Button -->
        <button
          type="button"
          id="burger-menu-btn"
          class="burger-btn"
          aria-label="Open Navigation & Tools Menu"
          aria-expanded="false"
          aria-controls="burger-drawer"
        >
          <span class="burger-icon-line"></span>
          <span class="burger-icon-line"></span>
          <span class="burger-icon-line"></span>
        </button>
      </div>
    </div>
    ${ScrollProgress()}
  `;
}

export function renderBurgerDrawer() {
  const state = store.getState();
  const isAgathe = state.activeProfile === 'agathe';
  const isFr = state.language === 'fr';

  return `
    <div id="burger-drawer-backdrop" class="drawer-backdrop" aria-hidden="true"></div>
    <aside id="burger-drawer" class="burger-drawer" aria-labelledby="burger-drawer-title" aria-hidden="true" role="dialog">
      <div class="burger-drawer-header">
        <div class="drawer-brand-wrap">
          <div class="brand-logo-icon mini">
            <svg viewBox="0 0 32 32" class="flag-icon" fill="currentColor" aria-hidden="true">
              <rect width="32" height="32" rx="6" fill="#DE2910"/>
              <polygon points="10,6 11.5,10.5 16,10.5 12.5,13 14,17.5 10,14.5 6,17.5 7.5,13 4,10.5 8.5,10.5" fill="#FFDE00"/>
              <circle cx="19" cy="8" r="1.2" fill="#FFDE00"/>
              <circle cx="22" cy="11" r="1.2" fill="#FFDE00"/>
              <circle cx="22" cy="15" r="1.2" fill="#FFDE00"/>
              <circle cx="19" cy="18" r="1.2" fill="#FFDE00"/>
            </svg>
          </div>
          <div>
            <h3 id="burger-drawer-title" class="drawer-brand-title">CHINA 2027</h3>
            <p class="drawer-brand-sub">${isFr ? 'Espace & Bloc-notes' : 'Workspace & Notes'}</p>
          </div>
        </div>
        <button type="button" id="burger-drawer-close" class="drawer-close-btn" aria-label="Close menu">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="burger-drawer-content">
        <!-- Section 1: Duo Workspace Switcher -->
        <div class="drawer-section">
          <span class="drawer-section-title">Espace Candidat</span>
          <div class="drawer-profiles-grid">
            <button type="button" class="drawer-profile-btn ${!isAgathe ? 'active' : ''}" data-profile="matthieu">
              <div class="profile-btn-header">
                <span class="profile-initial-badge">M</span>
                <span class="profile-name">Matthieu</span>
                <span class="profile-badge badge-stem">STIM & IA</span>
              </div>
              <p class="profile-desc">${isFr ? 'Ingénierie & Intelligence Artificielle' : 'Engineering & AI Track'}</p>
            </button>

            <button type="button" class="drawer-profile-btn ${isAgathe ? 'active' : ''}" data-profile="agathe">
              <div class="profile-btn-header">
                <span class="profile-initial-badge">A</span>
                <span class="profile-name">Agathe</span>
                <span class="profile-badge badge-mgmt">Management</span>
              </div>
              <p class="profile-desc">${isFr ? 'Commerce International & Langues' : 'Business & Languages Track'}</p>
            </button>
          </div>
        </div>

        <!-- Section 2: Notes Personnelles du Candidat (Indépendantes Matthieu / Agathe) -->
        <div class="drawer-section drawer-notes-section">
          <div class="drawer-notes-header">
            <span class="drawer-section-title">📝 ${isFr ? 'Bloc-Notes — ' + (isAgathe ? 'Agathe' : 'Matthieu') : 'Notes — ' + (isAgathe ? 'Agathe' : 'Matthieu')}</span>
            <span class="drawer-notes-status" id="drawer-notes-status">💾 ${isFr ? 'Enregistré' : 'Saved'}</span>
          </div>

          <!-- Notes Toolbar -->
          <div class="drawer-notes-toolbar" role="toolbar" aria-label="Notes Formatting Toolbar">
            <button type="button" class="notes-tool-btn" data-notes-action="link" title="Insérer un lien">
              <span>🔗 ${isFr ? 'Lien' : 'Link'}</span>
            </button>
            <button type="button" class="notes-tool-btn" data-notes-action="bullet" title="Ajouter une puce">
              <span>• ${isFr ? 'Puce' : 'Bullet'}</span>
            </button>
            <button type="button" class="notes-tool-btn" data-notes-action="todo" title="Ajouter une tâche à cocher">
              <span>☑️ ${isFr ? 'Tâche' : 'Task'}</span>
            </button>
            <button type="button" class="notes-tool-btn" data-notes-action="date" title="Insérer la date du jour">
              <span>📅 ${isFr ? 'Date' : 'Date'}</span>
            </button>
          </div>

          <!-- Notes Textarea -->
          <div class="drawer-notes-editor-wrap">
            <textarea
              id="drawer-notes-textarea"
              class="drawer-notes-textarea"
              placeholder="${isFr ? 'Notes, liens utiles, contacts, idées...' : 'Notes, links, contacts, ideas...'}"
              aria-label="Notes personnelles"
              spellcheck="false"
            >${state.candidateNotes || ''}</textarea>
          </div>
          <div class="drawer-notes-footer">
            <span id="drawer-notes-wordcount" class="notes-wordcount"></span>
            <button type="button" id="drawer-notes-clear-btn" class="notes-clear-btn" title="Vider la note">
              ${isFr ? 'Effacer' : 'Clear'}
            </button>
          </div>
        </div>

        <!-- Section 3: Données & Actions -->
        <div class="drawer-section">
          <span class="drawer-section-title">💾 ${isFr ? 'Données locales' : 'Local Data'}</span>
          <button type="button" id="drawer-reset-btn" class="btn btn-ghost drawer-reset-btn">
            <span>🔄 ${isFr ? 'Réinitialiser les favoris & checklist' : 'Reset favorites & checklist'}</span>
          </button>
        </div>
      </div>
    </aside>
  `.trim();
}

export function renderBottomNav() {
  const currentTab = store.getState().activeTab;
  return `
    <nav class="bottom-nav" role="tablist" aria-label="Mobile Navigation">
      ${NAV_ITEMS.map(
        (item) => `
        <button 
          type="button"
          class="bottom-nav-tab bottom-tab ${currentTab === item.id ? 'active' : ''}"
          role="tab"
          data-tab="${item.id}"
          data-testid="tab-${item.id}"
          aria-selected="${currentTab === item.id ? 'true' : 'false'}"
          aria-controls="view-${item.id}"
          aria-label="${t(item.label)} (${item.labelZh})"
        >
          <div class="nav-tab-icon-wrap tab-icon">
            ${item.icon}
          </div>
          <span class="nav-tab-label tab-label">${t(item.label)}</span>
        </button>
      `
      ).join('')}
    </nav>
  `;
}

export function openBurgerDrawer() {
  let drawer = document.getElementById('burger-drawer');
  let backdrop = document.getElementById('burger-drawer-backdrop');
  if (!drawer || !backdrop) {
    mountBurgerDrawer();
    drawer = document.getElementById('burger-drawer');
    backdrop = document.getElementById('burger-drawer-backdrop');
  }

  if (drawer && backdrop) {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    const burgerBtn = document.getElementById('burger-menu-btn');
    if (burgerBtn) {
      burgerBtn.classList.add('is-active');
      burgerBtn.setAttribute('aria-expanded', 'true');
    }
  }
}

export function closeBurgerDrawer() {
  const drawer = document.getElementById('burger-drawer');
  const backdrop = document.getElementById('burger-drawer-backdrop');

  if (drawer && backdrop) {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');

    const burgerBtn = document.getElementById('burger-menu-btn');
    if (burgerBtn) {
      burgerBtn.classList.remove('is-active');
      burgerBtn.setAttribute('aria-expanded', 'false');
    }
  }
}

export function mountBurgerDrawer() {
  let root = document.getElementById('burger-drawer-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'burger-drawer-root';
    document.body.appendChild(root);
  }
  root.innerHTML = renderBurgerDrawer();
  bindBurgerDrawerEvents();
}

export function bindBurgerDrawerEvents() {
  const textarea = document.getElementById('drawer-notes-textarea');
  const statusEl = document.getElementById('drawer-notes-status');
  const countEl = document.getElementById('drawer-notes-wordcount');
  const clearBtn = document.getElementById('drawer-notes-clear-btn');
  const isFr = store.getState().language === 'fr';

  const updateWordCount = (val = '') => {
    if (!countEl) return;
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    const chars = val.length;
    countEl.textContent = `${words} ${isFr ? 'mots' : 'words'} · ${chars} ${isFr ? 'caractères' : 'chars'}`;
  };

  if (textarea) {
    updateWordCount(textarea.value);

    let debounceTimer = null;
    textarea.addEventListener('input', () => {
      if (statusEl) {
        statusEl.textContent = `⏳ ${isFr ? 'Enregistrement...' : 'Saving...'}`;
        statusEl.classList.add('saving');
      }
      updateWordCount(textarea.value);

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        store.setCandidateNotes(textarea.value);
        if (statusEl) {
          statusEl.textContent = `💾 ${isFr ? 'Enregistré' : 'Saved'}`;
          statusEl.classList.remove('saving');
        }
      }, 400);
    });
  }

  // Formatting tools
  const toolBtns = document.querySelectorAll('.notes-tool-btn');
  toolBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!textarea) return;

      const action = btn.dataset.notesAction;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const selected = val.substring(start, end);

      let insert = '';
      if (action === 'link') {
        const url = window.prompt(isFr ? "Entrez l'URL du lien (ex: https://...) :" : "Enter link URL (e.g. https://...) :", "https://");
        if (url) {
          const text = selected || (window.prompt(isFr ? "Texte affiché pour le lien :" : "Text to display for link:", "Lien utile") || url);
          insert = `[${text}](${url})`;
        }
      } else if (action === 'bullet') {
        insert = selected ? selected.split('\n').map(l => l.startsWith('• ') ? l : '• ' + l).join('\n') : '\n• ';
      } else if (action === 'todo') {
        insert = selected ? selected.split('\n').map(l => l.startsWith('[ ] ') ? l : '[ ] ' + l).join('\n') : '\n[ ] ';
      } else if (action === 'date') {
        const now = new Date();
        const dateStr = now.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
        insert = `\n📅 [${dateStr}] `;
      }

      if (insert) {
        textarea.value = val.substring(0, start) + insert + val.substring(end);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + insert.length;
        store.setCandidateNotes(textarea.value);
        updateWordCount(textarea.value);
        if (statusEl) statusEl.textContent = `💾 ${isFr ? 'Enregistré' : 'Saved'}`;
      }
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.confirm(isFr ? "Voulez-vous effacer l'ensemble de cette note ?" : "Do you want to clear this note?")) {
        if (textarea) textarea.value = '';
        store.setCandidateNotes('');
        updateWordCount('');
        if (statusEl) statusEl.textContent = `💾 ${isFr ? 'Enregistré' : 'Saved'}`;
      }
    });
  }
}

export function setupNavigationEvents() {
  // Ensure burger drawer is mounted into DOM
  mountBurgerDrawer();

  const handleTabClick = (tabId) => {
    if (!tabId) return;
    store.setTab(tabId);
    syncNavigationDOM(tabId);
    closeBurgerDrawer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delegate click events on document
  document.addEventListener('click', (e) => {
    // Burger open/close buttons
    const burgerBtn = e.target.closest('#burger-menu-btn');
    if (burgerBtn) {
      e.preventDefault();
      const isOpen = document.getElementById('burger-drawer')?.classList.contains('is-open');
      if (isOpen) closeBurgerDrawer();
      else openBurgerDrawer();
      return;
    }

    const closeBtn = e.target.closest('#burger-drawer-close, #burger-drawer-backdrop');
    if (closeBtn) {
      e.preventDefault();
      closeBurgerDrawer();
      return;
    }

    const drawerLangBtn = e.target.closest('#drawer-lang-btn, #lang-toggle-btn');
    if (drawerLangBtn) {
      e.preventDefault();
      const currentLang = store.getState().language;
      const nextLang = currentLang === 'fr' ? 'en' : 'fr';
      store.setLanguage(nextLang);
      mountBurgerDrawer();
      return;
    }

    const resetBtn = e.target.closest('#drawer-reset-btn');
    if (resetBtn) {
      e.preventDefault();
      if (window.confirm("Êtes-vous sûr de vouloir réinitialiser vos favoris et checklists ?")) {
        try {
          localStorage.removeItem('china2027_favorites_v1_matthieu');
          localStorage.removeItem('china2027_favorites_v1_agathe');
          localStorage.removeItem('china2027_checklist_v1_matthieu');
          localStorage.removeItem('china2027_checklist_v1_agathe');
          localStorage.removeItem('china2027_hsk_progress_v1_matthieu');
          localStorage.removeItem('china2027_hsk_progress_v1_agathe');
          window.location.reload();
        } catch (_) {}
      }
      return;
    }

    const profBtn = e.target.closest('[data-profile]');
    if (profBtn) {
      e.preventDefault();
      const profId = profBtn.dataset.profile;
      store.setProfile(profId);
      closeBurgerDrawer();
      return;
    }

    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      e.preventDefault();
      handleTabClick(tabBtn.dataset.tab);
      return;
    }

    const brandBtn = e.target.closest('.brand-group, .brand');
    if (brandBtn && !brandBtn.closest('nav')) {
      e.preventDefault();
      handleTabClick('dashboard');
      closeBurgerDrawer();
      return;
    }

    const navCtaBtn = e.target.closest('[data-nav]');
    if (navCtaBtn) {
      e.preventDefault();
      handleTabClick(navCtaBtn.dataset.nav);
      closeBurgerDrawer();
      return;
    }
  });

  // Keyboard navigation & ESC handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBurgerDrawer();
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.hasAttribute('data-tab') || activeEl.hasAttribute('data-nav'))) {
        e.preventDefault();
        handleTabClick(activeEl.dataset.tab || activeEl.dataset.nav);
      }
    }
  });

  // Subscribe to tab state updates and sync DOM
  store.subscribeKey('activeTab', (newTab) => {
    syncNavigationDOM(newTab);
  });

  // Subscribe to profile changes to refresh drawer
  store.subscribeKey('activeProfile', () => {
    mountBurgerDrawer();
  });
}

export function syncNavigationDOM(activeTab = 'dashboard') {
  const currentTab = activeTab || 'dashboard';

  // Update all tab buttons (mobile, desktop, and drawer)
  const allTabs = document.querySelectorAll('[data-tab]');
  allTabs.forEach((tab) => {
    const isActive = tab.dataset.tab === currentTab;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Hero banner: only show on dashboard / accueil
  const heroEl = document.getElementById('hero-container');
  if (heroEl) {
    heroEl.style.display = currentTab === 'dashboard' ? 'block' : 'none';
  }

  // Update view panels: strictly show ONLY the active tab panel
  const allPanels = document.querySelectorAll('.view-panel, .app-view');
  allPanels.forEach((panel) => {
    const isTarget = panel.id === `view-${currentTab}`;
    panel.classList.toggle('active', isTarget);
    if (isTarget) {
      panel.removeAttribute('hidden');
      panel.style.display = 'block';
      panel.style.opacity = '1';
    } else {
      panel.setAttribute('hidden', '');
      panel.style.display = 'none';
      panel.style.opacity = '0';
    }
  });

  // Re-sync ScrollProgress with newly active tab panel height
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('scroll'));
  }
}
