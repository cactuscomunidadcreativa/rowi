const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/.claude/', // git worktrees de sesiones de agente — copias, no código real
    '<rootDir>/e2e/', // Playwright lives here — runs separately
  ],
  // Sin esto, Jest descubre los módulos duplicados de cada worktree bajo
  // .claude/ y avisa de "haste module naming collision".
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
  // Coverage thresholds are scoped to the slices we ACTIVELY test.
  // Global threshold is set to "no regression below current" — the
  // codebase is large and most legacy code is untested; gating CI on
  // 20% globally would block every commit. The scoped thresholds below
  // are where the active investment is, and those numbers SHOULD only
  // go up.
  //
  // To see the report: `pnpm test:coverage`. The two slices currently
  // protected are:
  //   - src/lib/account/**        contexts model helpers (must stay ≥50%)
  //   - src/lib/telemetry/**      telemetry adapter (must stay ≥50%)
  //   - src/app/api/account/**    family + services CRUD (must stay ≥70%)
  //   - src/app/api/admin/community-members/**  orphan flow (must stay ≥80%)
  coverageThreshold: {
    'src/lib/account/': {
      branches: 40, functions: 50, lines: 50, statements: 50,
    },
    'src/lib/telemetry/': {
      branches: 40, functions: 50, lines: 50, statements: 50,
    },
    'src/app/api/account/family/': {
      branches: 60, functions: 60, lines: 70, statements: 70,
    },
    'src/app/api/admin/community-members/assign/': {
      branches: 70, functions: 90, lines: 80, statements: 80,
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
