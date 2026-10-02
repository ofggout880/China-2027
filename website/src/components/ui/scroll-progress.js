/**
 * src/components/ui/scroll-progress.js
 * Magic UI - ScrollProgress Component
 * Renders a high-visibility animated scroll progress bar positioned at the bottom of the sticky navbar.
 */

let activeScrollListener = null;

/**
 * Generates the HTML markup for ScrollProgress
 * @param {Object} [props]
 * @param {string} [props.className] - Additional CSS classes
 * @returns {string} HTML string
 */
export function ScrollProgress({ className = '' } = {}) {
  return `
    <div class="magic-scroll-progress ${className}" id="magic-scroll-progress-track" role="progressbar" aria-label="Scroll Progress" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
      <div class="scroll-progress-fill" id="magic-scroll-progress-fill"></div>
    </div>
  `.trim();
}

/**
 * Mounts the ScrollProgress listener to dynamically update the bar on scroll
 * @returns {Function} cleanup function
 */
export function mountScrollProgress() {
  if (typeof window === 'undefined') return () => {};

  // Clean up any existing listener
  if (activeScrollListener) {
    window.removeEventListener('scroll', activeScrollListener);
    window.removeEventListener('resize', activeScrollListener);
    document.removeEventListener('scroll', activeScrollListener);
    activeScrollListener = null;
  }

  // Ensure progress bar element exists in header if header is present
  const appHeader = document.getElementById('app-header');
  if (appHeader && !document.getElementById('magic-scroll-progress-track')) {
    const temp = document.createElement('div');
    temp.innerHTML = ScrollProgress();
    appHeader.appendChild(temp.firstElementChild);
  }

  let ticking = false;

  const updateProgress = () => {
    const docEl = document.documentElement;
    const body = document.body;
    const scrollTop = window.scrollY || window.pageYOffset || docEl.scrollTop || body.scrollTop || 0;
    const scrollHeight = Math.max(
      docEl.scrollHeight,
      body.scrollHeight,
      docEl.offsetHeight,
      body.offsetHeight,
      docEl.clientHeight,
      body.clientHeight
    ) - window.innerHeight;

    const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
    const progressPercent = Math.round(progress * 100);

    const progressEl = document.getElementById('magic-scroll-progress-fill');
    const wrapperEl = document.getElementById('magic-scroll-progress-track') || document.querySelector('.magic-scroll-progress');

    if (progressEl) {
      progressEl.style.width = `${progress * 100}%`;
      progressEl.style.transform = `scaleX(1)`;
    }
    if (wrapperEl) {
      wrapperEl.setAttribute('aria-valuenow', String(progressPercent));
    }
    ticking = false;
  };

  activeScrollListener = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  };

  window.addEventListener('scroll', activeScrollListener, { passive: true });
  window.addEventListener('resize', activeScrollListener, { passive: true });
  document.addEventListener('scroll', activeScrollListener, { passive: true });

  // Initial calculation
  updateProgress();

  return () => {
    if (activeScrollListener) {
      window.removeEventListener('scroll', activeScrollListener);
      window.removeEventListener('resize', activeScrollListener);
      document.removeEventListener('scroll', activeScrollListener);
      activeScrollListener = null;
    }
  };
}

export default {
  ScrollProgress,
  mountScrollProgress
};
