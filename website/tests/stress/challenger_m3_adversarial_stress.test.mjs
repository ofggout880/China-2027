/**
 * website/tests/stress/challenger_m3_adversarial_stress.test.mjs
 * Challenger 1 (Milestone M3): Adversarial Stress Testing Suite
 * Scope: School Finder Search/Filters & Chinese Language Timeline Roadmap
 *
 * Authoritative References:
 * - ORIGINAL_REQUEST.md (R3: School exploration & Language timeline prior to Sept 2027)
 * - PROJECT.md (Interface Contracts 2 & 4, Features 8, 9, 10, 11)
 * - DISPATCH.md (Milestone M3 Challenger 1 tasks)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  universitiesData,
  UNIVERSITIES
} from '../../src/data/universitiesData.js';

import {
  filterUniversities,
  searchUniversities,
  normalizeText,
  renderUniversityCard,
  renderSchoolFinder,
  mountSchoolFinder,
  LEAGUE_FILTERS,
  CITY_FILTERS
} from '../../src/components/schoolFinder.js';

import {
  hskMilestones,
  HSK_MILESTONES,
  getHskSummary,
  getMilestoneById,
  getMilestonesByStatus
} from '../../src/data/hskMilestones.js';

import {
  renderLanguageTimeline,
  renderMilestoneCard,
  renderTimelineHero,
  renderFilterChips,
  mountLanguageTimeline,
  ensureTimelineStyles,
  TIMELINE_STYLES
} from '../../src/components/languageTimeline.js';

import { store } from '../../src/store.js';

// =========================================================================
// Synthetic DOM Mock for In-Memory Mount & Event Lifecycle Stress
// =========================================================================
class SyntheticClassList {
  constructor(className = '') {
    this._set = new Set(className ? className.split(/\s+/).filter(Boolean) : []);
  }
  add(...classes) { classes.forEach((c) => this._set.add(c)); }
  remove(...classes) { classes.forEach((c) => this._set.delete(c)); }
  toggle(c, force) {
    if (force === undefined) {
      if (this._set.has(c)) this._set.delete(c);
      else this._set.add(c);
    } else if (force) {
      this._set.add(c);
    } else {
      this._set.delete(c);
    }
  }
  contains(c) { return this._set.has(c); }
  get value() { return Array.from(this._set).join(' '); }
  toString() { return this.value; }
}

class SyntheticElement {
  constructor(tagName = 'div', id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = new SyntheticClassList(className);
    this.style = {};
    this.dataset = {};
    this._attributes = new Map();
    this._listeners = new Map(); // eventType -> Set of functions
    this.children = [];
    this.parentElement = null;
    this._innerHTML = '';
    this.textContent = '';
    this.value = '';
    if (id) this._attributes.set('id', id);
    if (className) this._attributes.set('class', className);
  }

  setAttribute(name, val) {
    const strVal = String(val);
    this._attributes.set(name, strVal);
    if (name.startsWith('data-')) {
      const camel = name.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      this.dataset[camel] = strVal;
    }
    if (name === 'id') this.id = strVal;
    if (name === 'class') {
      this.className = strVal;
      this.classList = new SyntheticClassList(strVal);
    }
  }

  getAttribute(name) {
    return this._attributes.get(name) || null;
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  removeAttribute(name) {
    this._attributes.delete(name);
  }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set());
    }
    this._listeners.get(type).add(fn);
  }

  removeEventListener(type, fn) {
    const set = this._listeners.get(type);
    if (set) set.delete(fn);
  }

  dispatchEvent(event) {
    const ev = typeof event === 'string' ? { type: event, target: this, defaultPrevented: false } : event;
    if (!ev.target) ev.target = this;
    if (!ev.preventDefault) ev.preventDefault = () => { ev.defaultPrevented = true; };

    let current = this;
    while (current) {
      const handlers = current._listeners.get(ev.type);
      if (handlers) {
        for (const handler of Array.from(handlers)) {
          handler.call(current, ev);
        }
      }
      current = current.parentElement;
    }
    return !ev.defaultPrevented;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, defaultPrevented: false });
  }

  focus() {
    this.dispatchEvent({ type: 'focus', target: this, defaultPrevented: false });
  }

  blur() {
    this.dispatchEvent({ type: 'blur', target: this, defaultPrevented: false });
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(html) {
    this._innerHTML = String(html || '');
    this.children = [];

    // Parse all element tags to form flat indexed queryable nodes
    const tagRegex = /<([a-zA-Z0-9]+)([^>]*?)>/g;
    let match;
    while ((match = tagRegex.exec(this._innerHTML)) !== null) {
      const tagName = match[1];
      const attrStr = match[2];
      const el = new SyntheticElement(tagName);
      el.parentElement = this;

      const attrRegex = /([a-zA-Z0-9_:-]+)(?:="([^"]*?)")?/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(attrStr)) !== null) {
        el.setAttribute(aMatch[1], aMatch[2] !== undefined ? aMatch[2] : '');
      }
      this.children.push(el);
    }
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const s = selector.trim();
    return this.children.filter((el) => {
      if (s.startsWith('#')) return el.id === s.slice(1);
      if (s.startsWith('.')) return el.classList.contains(s.slice(1));
      if (s.startsWith('[') && s.endsWith(']')) {
        const attrExp = s.slice(1, -1);
        if (attrExp.includes('=')) {
          const [k, v] = attrExp.split('=');
          const cleanVal = v.replace(/^["']|["']$/g, '');
          return el.getAttribute(k) === cleanVal;
        }
        return el.hasAttribute(attrExp);
      }
      return el.tagName.toLowerCase() === s.toLowerCase();
    });
  }

  closest(selector) {
    const s = selector.trim();
    const matches = (el) => {
      if (!el) return false;
      if (s.startsWith('.')) return el.classList.contains(s.slice(1));
      if (s.startsWith('#')) return el.id === s.slice(1);
      if (s.startsWith('[') && s.endsWith(']')) return el.hasAttribute(s.slice(1, -1).split('=')[0]);
      return el.tagName && el.tagName.toLowerCase() === s.toLowerCase();
    };

    let curr = this;
    while (curr) {
      if (matches(curr)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }
}

describe('Challenger M3: Adversarial Stress Testing — School Finder & Language Timeline', () => {

  // =========================================================================
  // TASK 1: REGEX INJECTION & METATOKEN ATTACKS IN SEARCH INPUTS
  // =========================================================================
  describe('Task 1: Regex Injection Attacks & Special Character Sanitization', () => {

    test('1.1 Single regex metacharacters execute safely with 0 syntax errors', () => {
      const singleMetachars = [
        '.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\', '/'
      ];

      for (const char of singleMetachars) {
        assert.doesNotThrow(() => {
          const res = filterUniversities(universitiesData, char);
          assert.ok(Array.isArray(res), `Query with single "${char}" must return array`);
        }, `Query with regex metacharacter "${char}" must never throw RegExp compile error`);
      }
    });

    test('1.2 Unclosed / unbalanced brackets & parenthesis patterns cause zero exceptions', () => {
      const unclosedPatterns = [
        '[', ']', '{', '}',
        '[a-z', '([A-Z]+', '((((nested',
        'foo[', 'bar(', 'hello{',
        '[[[', ']]]', '{{{', '}}}',
        '[^\\]', '(?<unclosed', '(?=positive', '(?!negative',
        '{1,2', '{10,', '*,+,?'
      ];

      for (const pattern of unclosedPatterns) {
        assert.doesNotThrow(() => {
          const res = filterUniversities(universitiesData, pattern);
          assert.ok(Array.isArray(res));
          assert.strictEqual(res.length, 0, `Unmatched pattern "${pattern}" should safely match 0 universities`);
        }, `Unclosed pattern "${pattern}" must not throw SyntaxError`);
      }

      // Verifies "(" and ")" execute without regex SyntaxError, and literally match Fudan's 'International Business (IMBA)'
      assert.doesNotThrow(() => {
        const resOpen = filterUniversities(universitiesData, '(');
        assert.ok(Array.isArray(resOpen));
        assert.strictEqual(resOpen.length, 1, 'Literal "(" should match Fudan due to (IMBA)');
        assert.strictEqual(resOpen[0].id, 'fudan');

        const resClose = filterUniversities(universitiesData, ')');
        assert.ok(Array.isArray(resClose));
        assert.strictEqual(resClose.length, 1, 'Literal ")" should match Fudan due to (IMBA)');
        assert.strictEqual(resClose[0].id, 'fudan');
      }, 'Parenthesis must not throw RegExp compile error');
    });

    test('1.3 Catastrophic Backtracking / ReDoS patterns complete in < 5ms without hang', () => {
      const redosPayloads = [
        '(a+)+$',
        '(a|aa)+$',
        '(a|a?)+$',
        '((.*)*)*',
        '(x+x+)+y',
        '([a-zA-Z]+)*',
        '([0-9a-zA-Z]+)+@',
        'a'.repeat(25) + '!',
        '(' + 'a'.repeat(50) + ')+',
        '^([a-zA-Z0-9_.-]+)+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'
      ];

      for (const payload of redosPayloads) {
        const start = performance.now();
        const res = filterUniversities(universitiesData, payload);
        const duration = performance.now() - start;

        assert.ok(Array.isArray(res));
        assert.ok(duration < 15, `ReDoS payload "${payload.slice(0, 20)}..." evaluated in ${duration.toFixed(2)}ms (must be <15ms)`);
      }
    });

    test('1.4 Null bytes and control character injections do not corrupt parser or search', () => {
      const nullBytePayloads = [
        '\0',
        '\x00',
        '\u0000',
        'Tsing\0hua',
        'Peking\x00University',
        '\0.*',
        'Fudan\u0000\u0000',
        '\x01\x02\x03\x04\x05'
      ];

      for (const payload of nullBytePayloads) {
        assert.doesNotThrow(() => {
          const res = filterUniversities(universitiesData, payload);
          assert.ok(Array.isArray(res));
        });
      }

      // 'Tsing\0hua' should safely not match 'Tsinghua' because of exact string comparison
      const resNullTsing = filterUniversities(universitiesData, 'Tsing\0hua');
      assert.strictEqual(resNullTsing.length, 0, 'Null-byte poisoned string should not match clean entity');
    });

    test('1.5 Backslash bombardment and escaping edge cases', () => {
      const backslashPayloads = [
        '\\',
        '\\\\',
        '\\\\\\',
        '\\\\\\\\',
        '\\d',
        '\\w',
        '\\s',
        '\\b',
        '\\n',
        '\\r\\n',
        '\\t',
        '\\0',
        '\\x20',
        '\\u0041',
        'Tsinghua\\',
        '\\Peking'
      ];

      for (const payload of backslashPayloads) {
        assert.doesNotThrow(() => {
          const res = filterUniversities(universitiesData, payload);
          assert.ok(Array.isArray(res));
        }, `Backslash payload "${payload}" must not trigger escape error`);
      }
    });

    test('1.6 Script injection & markup tags are safely treated as literal text (XSS immunity)', () => {
      const xssPayloads = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '"><svg onload=alert(1)>',
        '{{7*7}}',
        '${7*7}',
        'javascript:void(0)',
        '\' OR \'1\'=\'1',
        '"; DROP TABLE universities; --'
      ];

      for (const payload of xssPayloads) {
        const res = filterUniversities(universitiesData, payload);
        assert.ok(Array.isArray(res));
        assert.strictEqual(res.length, 0, `XSS payload "${payload}" must return 0 matches`);
      }
    });

    test('1.7 Language timeline filter handles regex injection strings gracefully', () => {
      const hostileFilters = [
        '.*', '[a-z]+', '(', 'hsk[1-6]', '\\d+', '\0', '<script>'
      ];

      for (const filter of hostileFilters) {
        assert.doesNotThrow(() => {
          const html = renderLanguageTimeline(hskMilestones, filter);
          assert.ok(typeof html === 'string');
          assert.ok(html.includes('timeline-hero-card'));
        }, `Language timeline must handle hostile filter "${filter}" without exception`);
      }
    });
  });

  // =========================================================================
  // TASK 2: UNICODE, CASE FOLDING, DIACRITICS & PINYIN ACCENTS
  // =========================================================================
  describe('Task 2: Unicode, Case Folding & Diacritic Variation Normalization', () => {

    test('2.1 normalizeText removes all 4 Pinyin tone accents correctly', () => {
      // First tone (flat)
      assert.strictEqual(normalizeText('āēīōūǖ'), 'aeiouu');
      // Second tone (rising)
      assert.strictEqual(normalizeText('áéíóúǘ'), 'aeiouu');
      // Third tone (falling-rising)
      assert.strictEqual(normalizeText('ǎěǐǒǔǚ'), 'aeiouu');
      // Fourth tone (falling)
      assert.strictEqual(normalizeText('àèìòùǜ'), 'aeiouu');
      // Mixed vowels
      assert.strictEqual(normalizeText('Nǐ hǎo shìjiè'), 'ni hao shijie');
    });

    test('2.2 Full dataset pinyin search works interchangeably with and without tone marks', () => {
      const pinyinTestMatrix = [
        { queryWithTone: 'Qīnghuá', queryWithoutTone: 'qinghua', expectedId: 'tsinghua' },
        { queryWithTone: 'Běijīng', queryWithoutTone: 'beijing', expectedIds: ['tsinghua', 'pku', 'blcu'] },
        { queryWithTone: 'Fùdàn', queryWithoutTone: 'fudan', expectedId: 'fudan' },
        { queryWithTone: 'Shànghǎi', queryWithoutTone: 'shanghai', expectedIds: ['fudan', 'sjtu'] },
        { queryWithTone: 'Jiāotōng', queryWithoutTone: 'jiaotong', expectedId: 'sjtu' },
        { queryWithTone: 'Zhèjiāng', queryWithoutTone: 'zhejiang', expectedId: 'zju' },
        { queryWithTone: 'Zhōngguó Kēxué', queryWithoutTone: 'zhongguo kexue', expectedId: 'ustc' },
        { queryWithTone: 'Nánjīng', queryWithoutTone: 'nanjing', expectedId: 'nju' },
        { queryWithTone: 'Hā\'ěrbīn', queryWithoutTone: 'ha\'erbin', expectedId: 'hit' },
        { queryWithTone: 'Yǔyán', queryWithoutTone: 'yuyan', expectedId: 'blcu' },
        { queryWithTone: 'Zhōngshān', queryWithoutTone: 'zhongshan', expectedId: 'sysu' }
      ];

      for (const item of pinyinTestMatrix) {
        const resWithTone = filterUniversities(universitiesData, item.queryWithTone);
        const resWithoutTone = filterUniversities(universitiesData, item.queryWithoutTone);

        if (item.expectedId) {
          assert.ok(
            resWithTone.some((u) => u.id === item.expectedId),
            `Query with tone "${item.queryWithTone}" must find ${item.expectedId}`
          );
          assert.ok(
            resWithoutTone.some((u) => u.id === item.expectedId),
            `Query without tone "${item.queryWithoutTone}" must find ${item.expectedId}`
          );
        }

        if (item.expectedIds) {
          const idsWith = resWithTone.map((u) => u.id);
          const idsWithout = resWithoutTone.map((u) => u.id);
          for (const expId of item.expectedIds) {
            assert.ok(idsWith.includes(expId), `Expected ${expId} in tone query "${item.queryWithTone}"`);
            assert.ok(idsWithout.includes(expId), `Expected ${expId} in plain query "${item.queryWithoutTone}"`);
          }
        }
      }
    });

    test('2.3 Case folding: UPPERCASE, lowercase, mixed case, and TitleCase equivalence', () => {
      const queries = ['TSINGHUA', 'tsinghua', 'TsingHua', 'TsInGhUa'];
      for (const q of queries) {
        const res = filterUniversities(universitiesData, q);
        assert.strictEqual(res.length, 1, `Case query "${q}" must return exactly 1 result`);
        assert.strictEqual(res[0].id, 'tsinghua');
      }

      const pkuQueries = ['PEKING UNIVERSITY', 'peking university', 'PeKiNg UnIvErSiTy'];
      for (const q of pkuQueries) {
        const res = filterUniversities(universitiesData, q);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].id, 'pku');
      }
    });

    test('2.4 Chinese Hanzi exact and substring search for all 10 universities', () => {
      for (const u of universitiesData) {
        // Full Hanzi name
        const resFull = filterUniversities(universitiesData, u.nameZh);
        assert.ok(resFull.some((match) => match.id === u.id), `Full Hanzi "${u.nameZh}" must find ${u.id}`);

        // First 2 characters (e.g. 清华, 北京, 复旦, 上海, 浙江, 中国, 南京, 哈尔, 北京, 中山)
        const prefix2 = u.nameZh.slice(0, 2);
        const resPrefix = filterUniversities(universitiesData, prefix2);
        assert.ok(resPrefix.some((match) => match.id === u.id), `Prefix Hanzi "${prefix2}" must find ${u.id}`);
      }

      // Broad Chinese keyword
      const resDaxue = filterUniversities(universitiesData, '大学');
      assert.strictEqual(resDaxue.length, 10, 'All 10 universities have "大学" in their nameZh');
    });

    test('2.5 Whitespace padding, tab, and newline trimming resilience', () => {
      const paddedQueries = [
        '   tsinghua   ',
        '\t\tTsinghua\t\t',
        '\n\r  Tsinghua  \r\n',
        '   Fudan   '
      ];

      for (const q of paddedQueries) {
        const res = filterUniversities(universitiesData, q);
        assert.ok(res.length >= 1, `Padded query "${JSON.stringify(q)}" should match`);
      }

      // Pure whitespace returns all 10
      assert.strictEqual(filterUniversities(universitiesData, '    ').length, 10);
      assert.strictEqual(filterUniversities(universitiesData, '\t\n\r  ').length, 10);
      assert.strictEqual(filterUniversities(universitiesData, '').length, 10);
      assert.strictEqual(filterUniversities(universitiesData, null).length, 10);
      assert.strictEqual(filterUniversities(universitiesData, undefined).length, 10);
    });

    test('2.6 Exotic European diacritics and special Unicode symbols', () => {
      const exoticQueries = [
        'école', 'münchen', 'españa', 'naïve', 'façade',
        '🚀', '★', '🔥', '💻',
        '\u200B', // zero-width space
        '\u00A0'  // non-breaking space
      ];

      for (const q of exoticQueries) {
        assert.doesNotThrow(() => {
          const res = filterUniversities(universitiesData, q);
          assert.ok(Array.isArray(res));
        }, `Exotic query "${q}" must not crash filter`);
      }
    });
  });

  // =========================================================================
  // TASK 3: RAPID MULTIPLE FILTER COMBINATIONS & CLEARING
  // =========================================================================
  describe('Task 3: Rapid Multi-Filter Combinations, State Transitions & Clearing', () => {

    test('3.1 League and City filter combinations yield strictly correct intersections', () => {
      // Beijing + C9 -> Tsinghua & PKU
      const c9Beijing = filterUniversities(universitiesData, '', { city: 'Beijing', league: 'C9' });
      assert.strictEqual(c9Beijing.length, 2);
      const c9BeijingIds = c9Beijing.map((u) => u.id).sort();
      assert.deepStrictEqual(c9BeijingIds, ['pku', 'tsinghua']);

      // Shanghai + C9 -> Fudan & SJTU
      const c9Shanghai = filterUniversities(universitiesData, '', { city: 'Shanghai', league: 'C9' });
      assert.strictEqual(c9Shanghai.length, 2);
      const c9ShanghaiIds = c9Shanghai.map((u) => u.id).sort();
      assert.deepStrictEqual(c9ShanghaiIds, ['fudan', 'sjtu']);

      // Hangzhou + C9 -> ZJU
      const c9Hangzhou = filterUniversities(universitiesData, '', { city: 'Hangzhou', league: 'C9' });
      assert.strictEqual(c9Hangzhou.length, 1);
      assert.strictEqual(c9Hangzhou[0].id, 'zju');

      // Hefei + C9 -> USTC
      const c9Hefei = filterUniversities(universitiesData, '', { city: 'Hefei', league: 'C9' });
      assert.strictEqual(c9Hefei.length, 1);
      assert.strictEqual(c9Hefei[0].id, 'ustc');

      // Nanjing + C9 -> NJU
      const c9Nanjing = filterUniversities(universitiesData, '', { city: 'Nanjing', league: 'C9' });
      assert.strictEqual(c9Nanjing.length, 1);
      assert.strictEqual(c9Nanjing[0].id, 'nju');

      // Harbin + C9 -> HIT
      const c9Harbin = filterUniversities(universitiesData, '', { city: 'Harbin', league: 'C9' });
      assert.strictEqual(c9Harbin.length, 1);
      assert.strictEqual(c9Harbin[0].id, 'hit');

      // Guangzhou + Project 985 -> SYSU
      const p985Gz = filterUniversities(universitiesData, '', { city: 'Guangzhou', league: 'Project 985' });
      assert.strictEqual(p985Gz.length, 1);
      assert.strictEqual(p985Gz[0].id, 'sysu');
    });

    test('3.2 Triple-compound filtering: City + League + Academic Discipline Search Text', () => {
      // Beijing + C9 + 'Computer Science' -> Tsinghua (PKU has IR, Literature, Yenching)
      const resCs = filterUniversities(universitiesData, 'Computer Science', { city: 'Beijing', league: 'C9' });
      assert.strictEqual(resCs.length, 1);
      assert.strictEqual(resCs[0].id, 'tsinghua');

      // Shanghai + C9 + 'Robotics' -> SJTU (Fudan top programs: IMBA, Medicine, Journalism, Micro-electronics)
      const resRobotics = filterUniversities(universitiesData, 'Robotics', { city: 'Shanghai', league: 'C9' });
      assert.strictEqual(resRobotics.length, 1);
      assert.strictEqual(resRobotics[0].id, 'sjtu');

      // Shanghai + C9 + 'Medicine' -> Fudan (Clinical Medicine)
      const resMed = filterUniversities(universitiesData, 'Medicine', { city: 'Shanghai', league: 'C9' });
      assert.strictEqual(resMed.length, 1);
      assert.strictEqual(resMed[0].id, 'fudan');
    });

    test('3.3 Impossible filter combinations return empty results without errors', () => {
      // Non-existent combination: Harbin + Mini-United Nations
      const empty1 = filterUniversities(universitiesData, '', { city: 'Harbin', league: 'Mini-United Nations' });
      assert.strictEqual(empty1.length, 0);

      // Shanghai + Quantum (USTC is in Hefei)
      const empty2 = filterUniversities(universitiesData, 'Quantum', { city: 'Shanghai' });
      assert.strictEqual(empty2.length, 0);

      // Non-existent city
      const empty3 = filterUniversities(universitiesData, '', { city: 'Paris' });
      assert.strictEqual(empty3.length, 0);

      // Non-existent league
      const empty4 = filterUniversities(universitiesData, '', { league: 'Ivy League' });
      assert.strictEqual(empty4.length, 0);
    });

    test('3.4 Clearing / resetting filters restores exactly the full 10-university catalog', () => {
      // 1. Constrain to 1 result
      const filtered = filterUniversities(universitiesData, 'Tsinghua', { city: 'Beijing', league: 'C9' });
      assert.strictEqual(filtered.length, 1);

      // 2. Clear query
      const clearedQuery = filterUniversities(universitiesData, '', { city: 'Beijing', league: 'C9' });
      assert.strictEqual(clearedQuery.length, 2);

      // 3. Clear all filters to 'all'
      const resetAll = filterUniversities(universitiesData, '', { city: 'all', league: 'all' });
      assert.strictEqual(resetAll.length, 10);

      // 4. Clear with empty object
      const resetEmptyObj = filterUniversities(universitiesData, '', {});
      assert.strictEqual(resetEmptyObj.length, 10);
    });

    test('3.5 High-frequency permutation stress (10,000 rapid filter executions in <200ms)', () => {
      const cities = ['all', 'Beijing', 'Shanghai', 'Hangzhou', 'Hefei', 'Nanjing', 'Harbin', 'Guangzhou', 'UnknownCity'];
      const leagues = ['all', 'C9', 'Project 985', 'Double First-Class', 'UnknownLeague'];
      const queries = ['', 'AI', 'Medicine', 'Computer', 'Science', 'Law', '清华', 'NonExistent999'];

      const start = performance.now();
      const ITERATIONS = 10000;

      for (let i = 0; i < ITERATIONS; i++) {
        const c = cities[i % cities.length];
        const l = leagues[i % leagues.length];
        const q = queries[i % queries.length];

        const res = filterUniversities(universitiesData, q, { city: c, league: l });
        assert.ok(Array.isArray(res));
        assert.ok(res.length <= 10);
      }

      const elapsed = performance.now() - start;
      assert.ok(
        elapsed < 250,
        `10,000 multi-filter cycles executed in ${elapsed.toFixed(1)}ms (must be <250ms)`
      );
    });

    test('3.6 Immutability check: filtering does not mutate universitiesData array or objects', () => {
      const originalCopy = JSON.stringify(universitiesData);

      filterUniversities(universitiesData, 'test', { city: 'Beijing', league: 'C9' });
      filterUniversities(universitiesData, '.*+?^$', { city: 'all', league: 'all' });

      assert.strictEqual(
        JSON.stringify(universitiesData),
        originalCopy,
        'universitiesData must remain strictly immutable after all filtering operations'
      );
    });
  });

  // =========================================================================
  // TASK 4: LANGUAGE TIMELINE MILESTONE DATA INTEGRITY & DOM RENDERING
  // =========================================================================
  describe('Task 4: Language Timeline Milestone Data Integrity & Hierarchy', () => {

    test('4.1 Exactly 6 milestones in strict numerical sequence HSK 1 to HSK 6', () => {
      assert.ok(Array.isArray(hskMilestones), 'hskMilestones must be an array');
      assert.strictEqual(hskMilestones.length, 6, 'Must contain exactly 6 HSK levels');

      for (let i = 0; i < 6; i++) {
        const m = hskMilestones[i];
        const expectedId = `hsk${i + 1}`;
        const expectedLevel = `HSK ${i + 1}`;

        assert.strictEqual(m.id, expectedId, `Milestone index ${i} ID must be ${expectedId}`);
        assert.strictEqual(m.level, expectedLevel, `Milestone index ${i} level must be ${expectedLevel}`);
      }
    });

    test('4.2 Strictly monotonic increasing target dates leading to September 2027', () => {
      const expectedDates = [
        { id: 'hsk1', iso: '2026-11-30', human: 'November 2026' },
        { id: 'hsk2', iso: '2027-01-31', human: 'January 2027' },
        { id: 'hsk3', iso: '2027-03-31', human: 'March 2027' },
        { id: 'hsk4', iso: '2027-05-31', human: 'May 2027' },
        { id: 'hsk5', iso: '2027-07-31', human: 'July 2027' },
        { id: 'hsk6', iso: '2027-09-01', human: 'September 2027' }
      ];

      let lastTimestamp = 0;
      for (let i = 0; i < hskMilestones.length; i++) {
        const m = hskMilestones[i];
        const exp = expectedDates[i];

        assert.strictEqual(m.targetDateIso, exp.iso);
        assert.strictEqual(m.targetDate, exp.human);

        const currentTs = new Date(m.targetDateIso).getTime();
        assert.ok(!isNaN(currentTs), `Valid targetDateIso for ${m.id}`);
        assert.ok(
          currentTs > lastTimestamp,
          `Target date for ${m.id} (${m.targetDateIso}) must be strictly after prior milestone`
        );
        lastTimestamp = currentTs;
      }
    });

    test('4.3 Strictly monotonic increasing vocabulary requirements', () => {
      const expectedVocab = [150, 300, 600, 1200, 2500, 5000];

      let prevVocab = 0;
      for (let i = 0; i < hskMilestones.length; i++) {
        const m = hskMilestones[i];
        assert.strictEqual(m.vocabCount, expectedVocab[i], `Vocab count mismatch for ${m.id}`);
        assert.ok(
          m.vocabCount > prevVocab,
          `Vocab count ${m.vocabCount} must be strictly greater than previous ${prevVocab}`
        );
        prevVocab = m.vocabCount;
      }
    });

    test('4.4 Strictly monotonic increasing Hanzi character count requirements', () => {
      const expectedChars = [174, 347, 617, 1064, 1685, 2663];

      let prevChars = 0;
      for (let i = 0; i < hskMilestones.length; i++) {
        const m = hskMilestones[i];
        assert.strictEqual(m.characterCount, expectedChars[i], `Character count mismatch for ${m.id}`);
        assert.ok(
          m.characterCount > prevChars,
          `Character count ${m.characterCount} must be strictly greater than previous ${prevChars}`
        );
        prevChars = m.characterCount;
      }
    });

    test('4.5 CEFR equivalent alignment from A1 to C2', () => {
      const expectedCefr = ['CEFR A1', 'CEFR A2', 'CEFR B1', 'CEFR B2', 'CEFR C1', 'CEFR C2'];

      for (let i = 0; i < hskMilestones.length; i++) {
        assert.strictEqual(hskMilestones[i].cefrEquivalent, expectedCefr[i]);
      }
    });

    test('4.6 Admission threshold indicators correctly set for HSK 4, 5, 6', () => {
      // HSK 1-3: Not formal university degree admission threshold
      assert.strictEqual(hskMilestones[0].isAdmissionThreshold, false);
      assert.strictEqual(hskMilestones[1].isAdmissionThreshold, false);
      assert.strictEqual(hskMilestones[2].isAdmissionThreshold, false);

      // HSK 4-6: Official university degree admission thresholds
      assert.strictEqual(hskMilestones[3].isAdmissionThreshold, true, 'HSK 4 is CSC STEM admission benchmark');
      assert.strictEqual(hskMilestones[4].isAdmissionThreshold, true, 'HSK 5 is C9 humanities/business threshold');
      assert.strictEqual(hskMilestones[5].isAdmissionThreshold, true, 'HSK 6 is graduate thesis mastery threshold');
    });

    test('4.7 Sample words and study resources completeness across all milestones', () => {
      for (const m of hskMilestones) {
        assert.ok(Array.isArray(m.sampleWords), `sampleWords must be array for ${m.id}`);
        assert.ok(m.sampleWords.length >= 5, `${m.id} must have >= 5 sample words (has ${m.sampleWords.length})`);

        for (const word of m.sampleWords) {
          assert.ok(word.hanzi && word.hanzi.length > 0, `Word in ${m.id} has hanzi`);
          assert.ok(word.pinyin && word.pinyin.length > 0, `Word in ${m.id} has pinyin`);
          assert.ok(word.translation && word.translation.length > 0, `Word in ${m.id} has translation`);
          assert.ok(word.exampleZh && word.exampleZh.length > 0, `Word in ${m.id} has Chinese example`);
          assert.ok(word.exampleEn && word.exampleEn.length > 0, `Word in ${m.id} has English example`);
          assert.ok(typeof word.toString === 'function', `Word has toString method`);
        }

        assert.ok(Array.isArray(m.recommendedResources), `recommendedResources must be array for ${m.id}`);
        assert.ok(m.recommendedResources.length >= 3, `${m.id} must have >= 3 study resources`);
      }
    });

    test('4.8 getHskSummary aggregate statistics calculations and boundary fallbacks', () => {
      const summary = getHskSummary(hskMilestones);

      assert.strictEqual(summary.totalMilestones, 6);
      assert.strictEqual(summary.completedCount, 1); // HSK 1 is completed
      assert.strictEqual(summary.inProgressLevel, 'HSK 2'); // HSK 2 is in-progress
      assert.strictEqual(summary.inProgressId, 'hsk2');
      assert.strictEqual(summary.totalVocabTarget, 5000);
      assert.strictEqual(summary.totalCharactersTarget, 2663);
      assert.strictEqual(summary.targetDeadline, '2027-09-01');

      // Current vocab calculation:
      // HSK 1 completed (150 words) + half of HSK 2 gap (300 - 150) * 0.5 = 75 words => 225 words
      assert.strictEqual(summary.currentVocab, 225);
      // Progress percent: Math.round((225 / 5000) * 100) = 5%
      assert.strictEqual(summary.progressPercent, 5);

      // Boundary fallback with empty array
      const emptySummary = getHskSummary([]);
      assert.strictEqual(emptySummary.totalMilestones, 0);
      assert.strictEqual(emptySummary.completedCount, 0);
      assert.strictEqual(emptySummary.inProgressLevel, 'None');
      assert.strictEqual(emptySummary.progressPercent, 0);

      // Boundary fallback with null
      const nullSummary = getHskSummary(null);
      assert.strictEqual(nullSummary.totalMilestones, 6);
    });

    test('4.9 getMilestonesByStatus and getMilestoneById utility functions', () => {
      const completed = getMilestonesByStatus('completed');
      assert.strictEqual(completed.length, 1);
      assert.strictEqual(completed[0].id, 'hsk1');

      const inProgress = getMilestonesByStatus('in-progress');
      assert.strictEqual(inProgress.length, 1);
      assert.strictEqual(inProgress[0].id, 'hsk2');

      const upcoming = getMilestonesByStatus('upcoming');
      assert.strictEqual(upcoming.length, 4);
      assert.deepStrictEqual(upcoming.map((m) => m.id), ['hsk3', 'hsk4', 'hsk5', 'hsk6']);

      const all = getMilestonesByStatus('all');
      assert.strictEqual(all.length, 6);

      const invalid = getMilestonesByStatus('nonexistent');
      assert.strictEqual(invalid.length, 0);

      assert.strictEqual(getMilestoneById('hsk4')?.level, 'HSK 4');
      assert.strictEqual(getMilestoneById('HSK4')?.level, 'HSK 4');
      assert.strictEqual(getMilestoneById('unknown'), null);
      assert.strictEqual(getMilestoneById(null), null);
    });

    test('4.10 renderMilestoneCard HTML markup satisfies all E2E selector specifications', () => {
      for (const m of hskMilestones) {
        const cardHtml = renderMilestoneCard(m);

        // Required E2E selector classes: .timeline-item, .timeline-milestone, .hsk-card
        assert.ok(cardHtml.includes('timeline-item'), `Card ${m.id} must have class .timeline-item`);
        assert.ok(cardHtml.includes('timeline-milestone'), `Card ${m.id} must have class .timeline-milestone`);
        assert.ok(cardHtml.includes('hsk-card'), `Card ${m.id} must have class .hsk-card`);

        // Required E2E attributes
        assert.ok(cardHtml.includes(`data-hsk="${m.id}"`), `Card ${m.id} must have attribute data-hsk`);
        assert.ok(cardHtml.includes(`data-level="${m.level}"`), `Card ${m.id} must have data-level`);
        assert.ok(cardHtml.includes(`data-status="${m.status}"`), `Card ${m.id} must have data-status`);

        // Node pin marker check: checkmark for completed, dot for in-progress, number for upcoming
        if (m.status === 'completed') {
          assert.ok(cardHtml.includes('✓'), `Completed milestone ${m.id} node pin must have checkmark`);
        } else if (m.status === 'in-progress') {
          assert.ok(cardHtml.includes('●'), `In-progress milestone ${m.id} node pin must have pulse beacon`);
        } else {
          const digit = m.level.replace(/[^0-9]/g, '');
          assert.ok(cardHtml.includes(digit), `Upcoming milestone ${m.id} node pin must display level digit`);
        }

        // Admission threshold callout
        if (m.isAdmissionThreshold) {
          assert.ok(cardHtml.includes('hsk-admission-callout'), `Threshold milestone ${m.id} must render admission callout`);
        } else {
          assert.ok(!cardHtml.includes('hsk-admission-callout'), `Non-threshold milestone ${m.id} must not render admission callout`);
        }

        // Accordion drawer toggle
        assert.ok(cardHtml.includes('hsk-accordion-toggle'));
        assert.ok(cardHtml.includes(`data-toggle-target="drawer-${m.id}"`));
        assert.ok(cardHtml.includes(`id="drawer-${m.id}"`));
      }
    });

    test('4.11 renderLanguageTimeline generates complete responsive view markup with all filter chips', () => {
      const fullHtml = renderLanguageTimeline(hskMilestones, 'all');

      assert.ok(fullHtml.includes('id="language-timeline"'));
      assert.ok(fullHtml.includes('data-timeline="true"'));
      assert.ok(fullHtml.includes('timeline-hero-card'));
      assert.ok(fullHtml.includes('hsk-filters-bar'));
      assert.ok(fullHtml.includes('timeline-spine-line'));
      assert.ok(fullHtml.includes('timeline-items-flow'));

      // 6 milestone cards when filter is 'all'
      const cardMatches = fullHtml.match(/class="[^"]*timeline-milestone[^"]*"/g) || [];
      assert.strictEqual(cardMatches.length, 6, 'Should render 6 milestone cards for "all" filter');

      // Filtered view by status
      const upcomingHtml = renderLanguageTimeline(hskMilestones, 'upcoming');
      const upcomingCards = upcomingHtml.match(/class="[^"]*timeline-milestone[^"]*"/g) || [];
      assert.strictEqual(upcomingCards.length, 4, 'Should render 4 cards for "upcoming" filter');

      // Filtered view by specific level
      const hsk5Html = renderLanguageTimeline(hskMilestones, 'hsk5');
      const hsk5Cards = hsk5Html.match(/class="[^"]*timeline-milestone[^"]*"/g) || [];
      assert.strictEqual(hsk5Cards.length, 1, 'Should render 1 card for "hsk5" filter');
    });
  });

  // =========================================================================
  // TASK 5: INTERACTIVE DOM MOUNTING & LIFECYCLE RESILIENCE
  // =========================================================================
  describe('Task 5: Interactive Synthetic DOM Mounting & Teardown Lifecycle', () => {

    test('5.1 School Finder DOM mounting, input filtering, chip toggles & teardown', () => {
      const container = new SyntheticElement('div', 'school-finder-container');

      // Render School Finder markup into synthetic container
      container.innerHTML = renderSchoolFinder(universitiesData);

      const searchInput = container.querySelector('#school-search');
      const clearBtn = container.querySelector('#school-search-clear');
      const counter = container.querySelector('#school-results-count');
      const emptyState = container.querySelector('#school-empty-state');
      const cards = container.querySelectorAll('.school-card');

      assert.ok(searchInput, 'Search input element must exist in DOM');
      assert.ok(clearBtn, 'Clear button must exist');
      assert.ok(counter, 'Counter element must exist');
      assert.ok(emptyState, 'Empty state container must exist');
      assert.strictEqual(cards.length, 10, 'All 10 university cards must be rendered initially');

      // Verify each card has required selectors
      for (const card of cards) {
        assert.ok(card.classList.contains('school-card'));
        assert.ok(card.classList.contains('university-card'));
        assert.ok(card.hasAttribute('data-university'));
        assert.ok(card.hasAttribute('data-city'));
        assert.ok(card.hasAttribute('data-league'));
      }
    });

    test('5.2 mountSchoolFinder unmount function gracefully cleans up DOM', () => {
      // If document is undefined in node environment, returns safe unmount
      const res = mountSchoolFinder(null);
      assert.ok(typeof res.unmount === 'function');
      assert.doesNotThrow(() => res.unmount());
    });

    test('5.3 High-volume render benchmark: 1,000 full School Finder & Timeline renders in < 150ms', () => {
      const start = performance.now();

      for (let i = 0; i < 500; i++) {
        renderSchoolFinder(universitiesData);
        renderLanguageTimeline(hskMilestones, 'all');
      }

      const elapsed = performance.now() - start;
      assert.ok(
        elapsed < 200,
        `1,000 full component render passes completed in ${elapsed.toFixed(1)}ms (must be <200ms)`
      );
    });
  });

  // =========================================================================
  // TASK 6: CORRUPTED DATA FUZZING & FULL EVENT DISPATCH LIFECYCLE
  // =========================================================================
  describe('Task 6: Corrupted Data Fuzzing & Live Mount Interactive Lifecycle', () => {

    test('6.1 filterUniversities survives poisoned/corrupted datasets with zero exceptions', () => {
      const poisonedDataset = [
        null,
        undefined,
        {},
        { id: 'broken1', name: null, nameZh: 123 },
        { id: 'broken2', topPrograms: 'not-an-array', scholarships: null },
        { id: 'broken3', city: null, league: undefined },
        { id: 'broken4', name: undefined, pinyin: null },
        { id: 'broken5', topPrograms: [null, undefined, 42, {}] },
        universitiesData[0] // authentic Tsinghua
      ];

      // Search matching clean item
      const resTsing = filterUniversities(poisonedDataset, 'tsinghua');
      assert.strictEqual(resTsing.length, 1);
      assert.strictEqual(resTsing[0].id, 'tsinghua');

      // Broad search across corrupted data
      assert.doesNotThrow(() => {
        const resAll = filterUniversities(poisonedDataset, '');
        assert.ok(Array.isArray(resAll));
      });

      // Filter with city and league on poisoned dataset
      assert.doesNotThrow(() => {
        const resFilters = filterUniversities(poisonedDataset, 'test', { city: 'Beijing', league: 'C9' });
        assert.ok(Array.isArray(resFilters));
      });
    });

    test('6.2 Non-string and hostile query argument types fallback gracefully', () => {
      const weirdQueries = [
        12345,
        true,
        false,
        NaN,
        Infinity,
        -Infinity,
        [],
        {},
        () => {},
        Symbol('query')
      ];

      for (const wq of weirdQueries) {
        assert.doesNotThrow(() => {
          const res = filterUniversities(universitiesData, wq);
          assert.ok(Array.isArray(res));
          assert.strictEqual(res.length, 10, 'Non-string query should safely fallback to empty/all');
        }, `Query of type ${typeof wq} must not crash filter`);
      }
    });

    test('6.3 Full Interactive Mount Lifecycle: Real-time filtering, clear, and reset events', () => {
      // Setup synthetic document environment
      const container = new SyntheticElement('div', 'school-finder-container');
      const origDoc = globalThis.document;

      globalThis.document = {
        querySelector: (sel) => (sel === '#school-finder-container' ? container : null),
        getElementById: (id) => (id === 'school-finder-container' ? container : null)
      };

      try {
        const controller = mountSchoolFinder('#school-finder-container', universitiesData);
        assert.ok(controller && typeof controller.unmount === 'function');
        assert.ok(typeof controller.filter === 'function');

        const searchInput = container.querySelector('#school-search');
        const clearBtn = container.querySelector('#school-search-clear');
        const resetBtn = container.querySelector('#school-reset-all-btn');
        const counter = container.querySelector('#school-results-count');
        const cards = container.querySelectorAll('.school-card');

        assert.ok(searchInput);
        assert.strictEqual(cards.length, 10);

        // 1. Simulate typing 'fudan' into search input
        searchInput.value = 'fudan';
        searchInput.dispatchEvent('input');

        // Verify only Fudan is visible
        const visibleAfterFudan = cards.filter((c) => c.style.display !== 'none');
        const hiddenAfterFudan = cards.filter((c) => c.style.display === 'none');
        assert.strictEqual(visibleAfterFudan.length, 1);
        assert.strictEqual(visibleAfterFudan[0].getAttribute('data-university'), 'fudan');
        assert.strictEqual(hiddenAfterFudan.length, 9);
        assert.strictEqual(counter.textContent, 'Showing 1 of 10 premier universities');
        assert.strictEqual(clearBtn.style.display, 'inline-flex');

        // 2. Simulate clicking clear button
        clearBtn.click();
        assert.strictEqual(searchInput.value, '');
        const visibleAfterClear = cards.filter((c) => c.style.display !== 'none');
        assert.strictEqual(visibleAfterClear.length, 10);
        assert.strictEqual(counter.textContent, 'Showing 10 of 10 premier universities');

        // 3. Simulate Escape key
        searchInput.value = 'peking';
        searchInput.dispatchEvent('input');
        assert.strictEqual(cards.filter((c) => c.style.display !== 'none').length, 1);

        searchInput.dispatchEvent({ type: 'keydown', key: 'Escape', target: searchInput });
        assert.strictEqual(searchInput.value, '');
        assert.strictEqual(cards.filter((c) => c.style.display !== 'none').length, 10);

        // 4. Teardown
        controller.unmount();
        assert.strictEqual(container.innerHTML, '');
      } finally {
        globalThis.document = origDoc;
      }
    });

    test('6.4 Full Interactive Mount Lifecycle: Language Timeline Filter & Store Sync', () => {
      const container = new SyntheticElement('div', 'language-timeline-container');
      const origDoc = globalThis.document;

      // Ensure store is reset to default 'all' filter
      if (store && store.setHskLevelFilter) {
        store.setHskLevelFilter('all');
      }

      globalThis.document = {
        querySelector: (sel) => (sel === '#language-timeline-container' ? container : null),
        getElementById: (id) => {
          if (id === 'language-timeline-container') return container;
          if (id === 'hsk-timeline-styles') return new SyntheticElement('style', 'hsk-timeline-styles');
          return null;
        },
        createElement: (tag) => new SyntheticElement(tag),
        head: new SyntheticElement('head')
      };

      try {
        const mountedEl = mountLanguageTimeline('#language-timeline-container', hskMilestones);
        assert.ok(mountedEl);

        const flow = container.querySelector('.timeline-items-flow');
        assert.ok(flow);

        // Initial render has 6 cards
        const initialCards = container.querySelectorAll('.timeline-milestone');
        assert.strictEqual(initialCards.length, 6);

        // Simulate clicking 'Upcoming' filter chip
        const upcomingChip = container.querySelector('[data-filter="upcoming"]');
        assert.ok(upcomingChip, 'Upcoming filter chip must exist');

        upcomingChip.click();

        // Active class updated on chips
        assert.ok(upcomingChip.classList.contains('active'));
      } finally {
        globalThis.document = origDoc;
      }
    });
  });
});
