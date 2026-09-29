/**
 * src/components/welcomeModal.js
 * First-visit Warning & Information Modal
 * Displays a prominent disclaimer on the first visit across any new browser session.
 */
import { store } from '../store.js';

const STORAGE_KEY = 'china2027_first_visit_warning_v1';

export function isWarningDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dismissed';
  } catch (_) {
    return false;
  }
}

export function dismissWarning() {
  try {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
  } catch (_) {}
}

export function renderWelcomeModal() {
  const isFr = store.getState().language === 'fr';

  return `
    <div id="welcome-modal-overlay" class="welcome-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title">
      <div class="welcome-modal-backdrop"></div>
      <div class="welcome-modal-card">
        <div class="welcome-modal-icon-wrap">
          <div class="welcome-modal-badge">⚠️</div>
        </div>

        <div class="welcome-modal-header">
          <h2 id="welcome-modal-title" class="welcome-modal-title">
            ${isFr ? 'Information Importante' : 'Important Notice'}
          </h2>
          <span class="welcome-modal-sub">
            🇨🇳 CHINA 2027 · ${isFr ? 'Projet d’études' : 'Study Roadmap'}
          </span>
        </div>

        <div class="welcome-modal-body">
          <div class="welcome-warning-box">
            <p class="welcome-warning-main">
              <strong>${isFr ? '⚠️ Attention :' : '⚠️ Warning:'}</strong> 
              ${isFr 
                ? 'Ne cliquez pas n’importe où parce que les données sont sauvegardées. Si vous modifiez une data, ça la modifie aussi pour moi.'
                : 'Please do not click anywhere carelessly because state is saved. Modifying data will modify it for me as well.'}
            </p>
          </div>

          <p class="welcome-modal-desc">
            ${isFr
              ? 'Bienvenue sur notre carnet de bord interactif pour la préparation de nos candidatures universitaires en Chine (Rentrée Septembre 2027). Vous pouvez explorer les universités de la Ligue C9, le plan d’apprentissage HSK et le tableau de bord macro.'
              : 'Welcome to our interactive dashboard preparing for university admissions in China (September 2027). You can explore C9 League universities, the HSK learning timeline, and macro metrics.'}
          </p>
        </div>

        <div class="welcome-modal-footer">
          <button type="button" id="welcome-modal-confirm-btn" class="welcome-modal-btn">
            <span>${isFr ? '👌 J’ai compris, accéder au site' : '👌 Got it, enter site'}</span>
          </button>
        </div>
      </div>
    </div>
  `.trim();
}

export function initWelcomeModal() {
  if (isWarningDismissed()) {
    return;
  }

  let root = document.getElementById('welcome-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'welcome-modal-root';
    document.body.appendChild(root);
  }

  root.innerHTML = renderWelcomeModal();

  const overlay = document.getElementById('welcome-modal-overlay');
  const confirmBtn = document.getElementById('welcome-modal-confirm-btn');

  const closeAndDismiss = () => {
    dismissWarning();
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        if (root && root.parentNode) {
          root.innerHTML = '';
        }
      }, 300);
    }
  };

  if (confirmBtn) {
    confirmBtn.addEventListener('click', closeAndDismiss);
  }

  // Also close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && overlay) {
      closeAndDismiss();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);
}
