/**
 * website/tests/unit/bentoGrid.test.mjs
 * Unit Test for Bento Grid & Bento Card Components
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BentoGrid, BentoCard } from '../../src/components/ui/bento-grid.js';
import { renderDashboardBento } from '../../src/components/dashboardBento.js';

describe('Bento Grid UI System Test Suite', () => {
  test('BentoGrid generates valid wrapper container', () => {
    const html = BentoGrid({
      className: 'custom-grid-class',
      children: '<div class="child-card">Content</div>'
    });

    assert.ok(html.includes('bento-grid'), 'Must include bento-grid class');
    assert.ok(html.includes('custom-grid-class'), 'Must include custom class');
    assert.ok(html.includes('child-card'), 'Must contain children');
  });

  test('BentoCard renders title, description, badge, and content', () => {
    const html = BentoCard({
      name: 'Card Title Test',
      badge: '★ Featured',
      description: 'Test description content',
      content: '<p id="test-inner">Inner Widget</p>',
      cta: 'Explore more',
      href: 'schools',
      className: 'bento-col-8'
    });

    assert.ok(html.includes('bento-card'), 'Must contain bento-card class');
    assert.ok(html.includes('bento-col-8'), 'Must include column span class');
    assert.ok(html.includes('Card Title Test'), 'Must render card title');
    assert.ok(html.includes('Featured'), 'Must render badge');
    assert.ok(html.includes('Inner Widget'), 'Must render inner content');
    assert.ok(html.includes('Explore more'), 'Must render CTA label');
    assert.ok(html.includes('data-nav="schools"'), 'Must include navigation target');
  });

  test('renderDashboardBento renders all 6 dashboard bento cards and slots', () => {
    const html = renderDashboardBento();
    assert.ok(html.includes('bento-hero-countdown'), 'Must include countdown bento card');
    assert.ok(html.includes('bento-candidates-card'), 'Must include candidate tracks bento card');
    assert.ok(html.includes('bento-chart-growth-card'), 'Must include student growth chart card');
    assert.ok(html.includes('bento-chart-donut-card'), 'Must include discipline donut chart card');
    assert.ok(html.includes('bento-metrics-card'), 'Must include macro metrics card');
    assert.ok(html.includes('bento-news-card'), 'Must include news feed card');
  });
});
