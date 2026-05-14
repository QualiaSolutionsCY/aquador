import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // The React 19 / eslint-plugin-react-hooks 7.0 rules below were not
      // enforced by the Next 14 baseline. They flag legitimate concerns in
      // legacy code (initial state from effects, ref reads during render,
      // impure helpers like `performance.now()`), but addressing them is
      // a code-quality task owned by later phases — not the Phase 2 stack
      // upgrade. Demote them to warnings so the upgrade does not regress
      // the pass/fail signal of `npm run lint`.
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // Same rationale: Next 16's eslint-plugin-next tightened this rule to
      // flag `<a href="/">` in App Router files (e.g. global-error.tsx,
      // src/app/reorder/page.tsx). These are pre-existing usages from the
      // Next 14 era that are owned by the later route-rebuild phase.
      '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  {
    ignores: [
      '**/__tests__/**',
      '**/e2e/**',
      'scripts/**',
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig;
