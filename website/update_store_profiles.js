import fs from 'fs';

const storeContent = `/**
 * src/store.js
 * Lightweight Reactive State Store for CHINA 2027
 * Pub/Sub pattern, LocalStorage persistence, multi-profile support (Matthieu & Agathe)
 */

const STORAGE_PREFIX = 'china2027_';
const DEFAULT_ACTIVE_PROFILE = 'matthieu';

export const PROFILES = {
  matthieu: {
    id: 'matthieu',
    name: 'Matthieu',
    avatar: '👦',
    focusTrack: 'Engineering & AI (STEM)',
    focusTrackFr: 'Ingénierie & IA (STIM)',
    targetHsk: 'HSK 5/6',
    initialFavs: ['thu', 'zju', 'ustc'],
    initialChecklist: {
      doc_passport: true,
      doc_transcripts: true,
      doc_language: false,
      doc_recommendations: false,
      doc_study_plan: false,
      doc_physical_exam: false,
      doc_police_clearance: false,
      doc_financial: false
    },
    completedHsk: ['hsk1', 'hsk2', 'hsk3']
  },
  agathe: {
    id: 'agathe',
    name: 'Agathe',
    avatar: '👧',
    focusTrack: 'Management & Languages',
    focusTrackFr: 'Management & Langues',
    targetHsk: 'HSK 4/5',
    initialFavs: ['fudan', 'pku', 'blcu'],
    initialChecklist: {
      doc_passport: true,
      doc_transcripts: false,
      doc_language: true,
      doc_recommendations: false,
      doc_study_plan: false,
      doc_physical_exam: false,
      doc_police_clearance: false,
      doc_financial: false
    },
    completedHsk: ['hsk1', 'hsk2']
  }
};

export const DEFAULT_CHECKLIST_STATE = {
  doc_passport: true,
  doc_transcripts: true,
  doc_language: false,
  doc_recommendations: false,
  doc_study_plan: false,
  doc_physical_exam: false,
  doc_police_clearance: false,
  doc_financial: false
};

// In-memory fallbacks
let memoryProfileFallback = 'matthieu';
let memoryChecklist = {
  matthieu: { ...PROFILES.matthieu.initialChecklist },
  agathe: { ...PROFILES.agathe.initialChecklist }
};
let memoryFavs = {
  matthieu: [...PROFILES.matthieu.initialFavs],
  agathe: [...PROFILES.agathe.initialFavs]
};
let memoryHsk = {
  matthieu: [...PROFILES.matthieu.completedHsk],
  agathe: [...PROFILES.agathe.completedHsk]
};

export function getStoredActiveProfile() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(STORAGE_PREFIX + 'active_profile');
      if (stored && PROFILES[stored]) return stored;
    }
  } catch (err) {}
  return memoryProfileFallback;
}

export function saveStoredActiveProfile(profileId) {
  memoryProfileFallback = profileId;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_PREFIX + 'active_profile', profileId);
    }
  } catch (err) {}
}

export function getStoredChecklist(profileId = 'matthieu') {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Check profile specific key first, fallback to legacy key if matthieu
      const key = STORAGE_PREFIX + 'checklist_' + profileId;
      let stored = window.localStorage.getItem(key);
      if (!stored && profileId === 'matthieu') {
        stored = window.localStorage.getItem('china2027_checklist_v1');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const result = {};
          for (const k of Object.keys(DEFAULT_CHECKLIST_STATE)) {
            result[k] = parsed.includes(k);
          }
          return result;
        } else if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_CHECKLIST_STATE, ...parsed };
        }
      }
    }
  } catch (err) {}
  return memoryChecklist[profileId] || { ...PROFILES[profileId]?.initialChecklist || DEFAULT_CHECKLIST_STATE };
}

export function saveStoredChecklist(checklist, profileId = 'matthieu') {
  if (!memoryChecklist[profileId]) memoryChecklist[profileId] = {};
  memoryChecklist[profileId] = { ...checklist };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const checkedIds = Object.keys(checklist).filter((k) => Boolean(checklist[k]));
      window.localStorage.setItem(STORAGE_PREFIX + 'checklist_' + profileId, JSON.stringify(checkedIds));
      // Also update legacy key for backward compatibility with tests
      if (profileId === 'matthieu') {
        window.localStorage.setItem('china2027_checklist_v1', JSON.stringify(checkedIds));
      }
      return true;
    }
  } catch (err) {}
  return false;
}

export function getStoredFavorites(profileId = 'matthieu') {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = STORAGE_PREFIX + 'fav_schools_' + profileId;
      let stored = window.localStorage.getItem(key);
      if (!stored && profileId === 'matthieu') {
        stored = window.localStorage.getItem('china2027_fav_schools_v1');
      }
      if (stored) return JSON.parse(stored);
    }
  } catch (err) {}
  return memoryFavs[profileId] || [...PROFILES[profileId]?.initialFavs || []];
}

export function saveStoredFavorites(favs, profileId = 'matthieu') {
  memoryFavs[profileId] = [...favs];
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const key = STORAGE_PREFIX + 'fav_schools_' + profileId;
      window.localStorage.setItem(key, JSON.stringify(favs));
      if (profileId === 'matthieu') {
        window.localStorage.setItem('china2027_fav_schools_v1', JSON.stringify(favs));
      }
      return true;
    }
  } catch (err) {}
  return false;
}

export function calculateChecklistStats(checklistState) {
  const state = checklistState || {};
  const total = Object.keys(DEFAULT_CHECKLIST_STATE).length;
  const completed = Object.keys(DEFAULT_CHECKLIST_STATE).reduce((acc, k) => acc + (state[k] ? 1 : 0), 0);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    completed,
    total,
    percentage: percent,
    percent,
    formattedText: \`\${completed} of \${total} completed (\${percent}%)\`
  };
}

const initialProfile = getStoredActiveProfile();

const initialState = {
  activeProfile: initialProfile, // 'matthieu' | 'agathe'
  activeTab: 'dashboard',
  checklist: getStoredChecklist(initialProfile),
  favoriteSchools: getStoredFavorites(initialProfile),
  schoolSearchQuery: '',
  selectedSchoolBadgeFilter: 'all',
  selectedHskLevel: 'all',
  language: 'en'
};

class Store {
  constructor(state) {
    this._state = { ...state };
    this._listeners = new Set();
    this._keyListeners = new Map();
  }

  getState() {
    return { ...this._state };
  }

  setState(partialState) {
    const prevState = { ...this._state };
    const nextState = { ...this._state, ...partialState };
    this._state = nextState;

    const changedKeys = Object.keys(partialState).filter(
      (key) => prevState[key] !== nextState[key]
    );

    if (changedKeys.length === 0) return;

    // Handle persistence
    if (changedKeys.includes('activeProfile')) {
      saveStoredActiveProfile(nextState.activeProfile);
    }
    if (changedKeys.includes('checklist')) {
      saveStoredChecklist(nextState.checklist, nextState.activeProfile);
    }
    if (changedKeys.includes('favoriteSchools')) {
      saveStoredFavorites(nextState.favoriteSchools, nextState.activeProfile);
    }

    // Notify key-specific listeners
    for (const key of changedKeys) {
      const listeners = this._keyListeners.get(key);
      if (listeners) {
        for (const listener of listeners) {
          try {
            listener(nextState[key], prevState[key]);
          } catch (e) {
            console.error(\`[store] Error in listener for key \${key}:\`, e);
          }
        }
      }
    }

    // Notify general subscribers
    for (const listener of this._listeners) {
      try {
        listener(nextState, prevState, changedKeys);
      } catch (e) {
        console.error('[store] Error in general subscriber:', e);
      }
    }
  }

  setProfile(profileId) {
    if (!PROFILES[profileId]) return;
    const currentProfile = this._state.activeProfile;
    if (currentProfile === profileId) return;

    // Save current profile data first
    saveStoredChecklist(this._state.checklist, currentProfile);
    saveStoredFavorites(this._state.favoriteSchools, currentProfile);

    // Load new profile data
    const nextChecklist = getStoredChecklist(profileId);
    const nextFavorites = getStoredFavorites(profileId);

    this.setState({
      activeProfile: profileId,
      checklist: nextChecklist,
      favoriteSchools: nextFavorites
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profilechange', { detail: { profile: profileId } }));
    }
  }

  setTab(tabId) {
    const validTabs = ['dashboard', 'schools', 'timeline', 'checklist'];
    if (validTabs.includes(tabId)) {
      this.setState({ activeTab: tabId });
    }
  }

  toggleChecklistItem(id) {
    const currentChecklist = { ...this._state.checklist };
    currentChecklist[id] = !currentChecklist[id];
    this.setState({ checklist: currentChecklist });
    return currentChecklist[id];
  }

  setChecklistItem(id, isCompleted) {
    const currentChecklist = { ...this._state.checklist };
    currentChecklist[id] = Boolean(isCompleted);
    this.setState({ checklist: currentChecklist });
  }

  resetChecklist() {
    const activeProf = this._state.activeProfile;
    const initialForProfile = PROFILES[activeProf]?.initialChecklist || DEFAULT_CHECKLIST_STATE;
    this.setState({ checklist: { ...initialForProfile } });
  }

  setSearchQuery(query) {
    this.setState({ schoolSearchQuery: String(query || '').trim() });
  }

  setSchoolBadgeFilter(badge) {
    this.setState({ selectedSchoolBadgeFilter: String(badge || 'all') });
  }

  setHskLevelFilter(level) {
    this.setState({ selectedHskLevel: String(level || 'all') });
  }

  toggleFavoriteSchool(id) {
    const currentFavs = this._state.favoriteSchools || [];
    const isFav = currentFavs.includes(id);
    const nextFavs = isFav ? currentFavs.filter(fid => fid !== id) : [...currentFavs, id];
    this.setState({ favoriteSchools: nextFavs });
    return !isFav;
  }

  setLanguage(lang) {
    if (['en', 'fr'].includes(lang)) {
      this.setState({ language: lang });
    }
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  subscribeKey(key, listener) {
    if (!this._keyListeners.has(key)) {
      this._keyListeners.set(key, new Set());
    }
    this._keyListeners.get(key).add(listener);
    return () => {
      const set = this._keyListeners.get(key);
      if (set) {
        set.delete(listener);
        if (set.size === 0) this._keyListeners.delete(key);
      }
    };
  }
}

export const store = new Store(initialState);
`;

fs.writeFileSync('src/store.js', storeContent);
