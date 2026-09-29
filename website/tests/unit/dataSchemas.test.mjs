/**
 * website/tests/unit/dataSchemas.test.mjs
 * Tier 1 Unit Test: Mock Data Schemas & Interface Contract Integrity
 * Authoritative Source: ORIGINAL_REQUEST.md (R2, R3), PROJECT.md (Interface Contracts 1-4)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../src/data');

describe('Tier 1: Data Schemas & Interface Contract Compliance', () => {
  test('Universities Dataset Schema Integrity (10 Premier Universities)', async (t) => {
    const filePath = path.join(DATA_DIR, 'universitiesData.js');
    if (!fs.existsSync(filePath)) {
      t.skip('src/data/universitiesData.js not yet created (scheduled for M3)');
      return;
    }

    const mod = await import(filePath);
    const universities = mod.universitiesData || mod.default || mod.UNIVERSITIES;

    assert.ok(Array.isArray(universities), 'Universities data must export an array');
    assert.ok(universities.length >= 10, `Must contain at least 10 universities, found ${universities.length}`);

    const requiredFields = [
      'id',
      'name',
      'nameZh',
      'pinyin',
      'city',
      'rankQs',
      'rankThe',
      'league',
      'topPrograms',
      'tuitionRMB',
      'scholarships',
    ];

    for (const u of universities) {
      for (const field of requiredFields) {
        assert.ok(u[field] !== undefined, `University ${u.id || 'unknown'} missing required field "${field}"`);
      }
      assert.ok(typeof u.rankQs === 'number' && u.rankQs > 0, `QS Rank must be positive number for ${u.id}`);
      assert.ok(typeof u.rankThe === 'number' && u.rankThe > 0, `THE Rank must be positive number for ${u.id}`);
      assert.ok(Array.isArray(u.topPrograms) && u.topPrograms.length > 0, `topPrograms must be non-empty array for ${u.id}`);
      assert.ok(Array.isArray(u.scholarships) && u.scholarships.length > 0, `scholarships must be non-empty array for ${u.id}`);
    }
  });

  test('Document Checklist Schema Integrity (>= 5 Items, Target 8 Documents)', async (t) => {
    const filePath = path.join(DATA_DIR, 'checklistData.js');
    if (!fs.existsSync(filePath)) {
      t.skip('src/data/checklistData.js not yet created (scheduled for M3)');
      return;
    }

    const mod = await import(filePath);
    const checklist = mod.checklistData || mod.default || mod.CHECKLIST_ITEMS;

    assert.ok(Array.isArray(checklist), 'Checklist data must export an array');
    assert.ok(checklist.length >= 5, `Must contain >= 5 checklist items, found ${checklist.length}`);
    assert.ok(checklist.length >= 8, `Should preferably contain 8 comprehensive documents, found ${checklist.length}`);

    const requiredFields = ['id', 'title', 'category', 'description', 'defaultCompleted', 'requiredFor'];

    for (const item of checklist) {
      for (const field of requiredFields) {
        assert.ok(item[field] !== undefined, `Checklist item ${item.id || 'unknown'} missing required field "${field}"`);
      }
      assert.ok(typeof item.defaultCompleted === 'boolean', `defaultCompleted must be boolean for ${item.id}`);
      assert.ok(item.title.trim().length > 0, `title must be non-empty for ${item.id}`);
    }
  });

  test('HSK Language Timeline Schema Integrity (Levels 1 to 6 in Order)', async (t) => {
    const filePath = path.join(DATA_DIR, 'hskMilestones.js');
    if (!fs.existsSync(filePath)) {
      t.skip('src/data/hskMilestones.js not yet created (scheduled for M3)');
      return;
    }

    const mod = await import(filePath);
    const milestones = mod.hskMilestones || mod.default || mod.HSK_MILESTONES;

    assert.ok(Array.isArray(milestones), 'HSK milestones must export an array');
    assert.strictEqual(milestones.length, 6, 'Must contain exactly 6 HSK levels (HSK 1-6)');

    let prevVocab = 0;
    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      assert.ok(m.level.includes(String(i + 1)), `Milestone ${i} must represent HSK ${i + 1}`);
      assert.ok(typeof m.vocabCount === 'number', `vocabCount must be number for ${m.id}`);
      assert.ok(m.vocabCount > prevVocab, `vocabCount must strictly increase: ${m.vocabCount} > ${prevVocab}`);
      prevVocab = m.vocabCount;
      assert.ok(m.targetDate && m.targetDate.length > 0, `targetDate must be set for ${m.id}`);
      assert.ok(m.competency && m.competency.length > 0, `competency must be set for ${m.id}`);
    }
  });

  test('China Macro Statistics & Chart Data Schema Integrity', async (t) => {
    const filePath = path.join(DATA_DIR, 'chinaStatistics.js');
    if (!fs.existsSync(filePath)) {
      t.skip('src/data/chinaStatistics.js not yet created (scheduled for M2)');
      return;
    }

    const mod = await import(filePath);
    const stats = mod.chinaStatistics || mod.default || mod.CHINA_STATS;

    assert.ok(stats, 'China statistics must be exported');
    assert.ok(Array.isArray(stats.macroStats), 'macroStats must be an array');
    assert.strictEqual(stats.macroStats.length, 6, 'Must contain exactly 6 macroeconomic metric cards');

    assert.ok(stats.charts, 'charts object must be present');
    assert.ok(stats.charts.studentEnrollmentTrend, 'studentEnrollmentTrend chart data must exist');
    assert.ok(stats.charts.disciplineDistribution, 'disciplineDistribution chart data must exist');

    assert.ok(Array.isArray(stats.charts.studentEnrollmentTrend.data), 'studentEnrollmentTrend data must be an array');
    assert.ok(Array.isArray(stats.charts.disciplineDistribution.data), 'disciplineDistribution data must be an array');
  });
});
