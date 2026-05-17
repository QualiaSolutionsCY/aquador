import AxeBuilder from '@axe-core/playwright';
import { test, type Page } from '@playwright/test';

/**
 * runAxe — runs axe-core against the current page state and fails the test
 * when ANY critical-impact violation is present.
 *
 * Why critical-only:
 *  - serious/moderate/minor violations are reported as test annotations so
 *    they show up in the Playwright HTML report without blocking the suite.
 *  - critical violations are the WCAG-A baseline we will not regress on
 *    (no name, no role, no contrast on text, no keyboard trap, etc).
 *
 * The full violations JSON is attached as a test annotation regardless of
 * outcome so the Phase 3 audit reports can quote evidence.
 */
export async function runAxe(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();

  // Attach full violations JSON to the test for the HTML report. Keep the
  // label so multiple runAxe calls in a single test are distinguishable.
  test.info().annotations.push({
    type: `axe:${label}`,
    description: JSON.stringify(
      {
        url: page.url(),
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodeCount: v.nodes.length,
          targets: v.nodes.slice(0, 3).map((n) => n.target),
        })),
      },
      null,
      2,
    ),
  });

  const critical = results.violations.filter((v) => v.impact === 'critical');
  if (critical.length > 0) {
    const ids = critical.map((v) => v.id);
    throw new Error(
      `axe critical violations on ${label}: ${ids.join(', ')}`,
    );
  }
}
