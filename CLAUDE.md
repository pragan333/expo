# CLAUDE.md — Expo Monorepo

This file provides guidance for AI assistants (and developers) working in the Expo repository.

## Repository Overview

Expo is an open-source platform for building universal native apps using React Native. This is the main monorepo containing the Expo SDK, CLI tools, documentation, and supporting infrastructure.

- **Package manager:** Yarn 1 (Classic) with workspaces
- **Node version:** 22.14.0 (pinned via Volta in root `package.json`)
- **Language:** TypeScript (strict mode), with native code in Kotlin (Android) and Swift (iOS)
- **React Native version:** 0.81.x (uses a fork at `react-native-lab/react-native`)
- **License:** MIT

## Monorepo Structure

```
expo/
├── apps/                  # Example and test applications
│   ├── bare-expo/         # Main development/testing app (links all SDK packages)
│   ├── test-suite/        # Automated E2E test runner
│   ├── native-component-list/  # Manual smoke tests and demos
│   ├── expo-go/           # Expo Go client app
│   ├── router-e2e/        # Expo Router E2E tests
│   └── ...
├── packages/              # All Expo SDK packages (~110+)
│   ├── expo/              # Core expo package (v53.x)
│   ├── expo-modules-core/ # Native module infrastructure (Swift/Kotlin APIs)
│   ├── expo-router/       # File-based routing for React Native
│   ├── expo-camera/       # Camera API (representative SDK package)
│   ├── @expo/cli/         # Expo CLI
│   ├── @expo/config/      # app.json/app.config.js resolution
│   ├── @expo/config-plugins/  # Native config modification plugins
│   ├── @expo/fingerprint/ # Build fingerprinting
│   ├── @expo/metro-config/ # Metro bundler configuration
│   ├── expo-module-scripts/  # Shared build/test/lint toolchain for all modules
│   ├── jest-expo/         # Jest preset for Expo projects
│   ├── babel-preset-expo/ # Babel preset for Expo projects
│   ├── create-expo/       # Project scaffolding CLI
│   └── ...
├── docs/                  # Documentation site (Next.js)
├── tools/                 # Internal "expotools" (et) CLI for repo maintenance
├── guides/                # Internal development guides and style guides
├── templates/             # Project templates
├── scripts/               # Setup and CI scripts
├── react-native-lab/      # React Native fork (git submodule)
└── fastlane/              # iOS/Android build automation
```

## Workspace Configuration

Workspaces are defined in the root `package.json`:
```json
{
  "workspaces": {
    "packages": ["apps/*", "packages/*", "packages/@expo/*"]
  }
}
```

## Common Commands

### Root-level

| Command | Purpose |
|---------|---------|
| `yarn install` | Install all dependencies (runs `yarn-deduplicate` and `patch-package` via postinstall) |
| `yarn lint` | Run ESLint across the entire repo |
| `yarn setup:docs` | Download documentation dependencies |
| `yarn setup:native` | Set up native development (submodules, Android NDK, etc.) |

### Per-package (run from within a package directory)

All SDK packages use `expo-module-scripts` to provide a unified interface:

| Command | Purpose |
|---------|---------|
| `yarn build` | Compile TypeScript to `build/` directory |
| `yarn clean` | Remove build artifacts |
| `yarn lint` | Run ESLint (with Prettier) |
| `yarn lint --fix` | Auto-fix lint and formatting issues |
| `yarn test` | Run Jest tests (interactive — press X to select platform) |
| `yarn prepare` | Prepare package for publishing |
| `EXPO_NONINTERACTIVE=1 yarn test` | Run tests in CI/non-interactive mode |

### Expotools (`et`)

The `tools/` directory contains `expotools`, an internal CLI accessed via `et`:

| Command | Purpose |
|---------|---------|
| `et generate-docs-api-data -p <pkg>` | Generate API documentation from source |
| `et add-changelog` | Add a changelog entry to a package |
| `et merge-changelogs` | Merge changelogs for SDK releases |

### Documentation (from `docs/` directory)

| Command | Purpose |
|---------|---------|
| `yarn` | Install docs dependencies |
| `yarn dev` | Start docs dev server on port 3002 |

## Package Structure

A typical Expo SDK package follows this layout:

```
expo-<name>/
├── src/
│   ├── index.ts              # Main entry point (exports public API)
│   ├── <Name>.ts             # Core implementation
│   ├── <Name>.types.ts       # TypeScript type definitions
│   ├── <Name>.web.ts         # Web-specific implementation
│   ├── Expo<Name>.ts         # Native module bridge
│   └── __tests__/
│       └── <Name>-test.ts    # Unit tests
├── android/
│   └── src/main/java/expo/modules/<name>/
│       └── <Name>Module.kt   # Kotlin native module
├── ios/
│   ├── <Name>Module.swift    # Swift native module
│   └── Expo<Name>.podspec    # CocoaPods spec
├── build/                    # Compiled JS (COMMITTED to git)
├── expo-module.config.json   # Module configuration (platforms, module names)
├── package.json
├── tsconfig.json
└── CHANGELOG.md
```

**Important:** The `build/` directory is committed to git. This ensures all contributors run the same compiled code without rebuilding locally.

## TypeScript Configuration

- Base config: `expo-module-scripts/tsconfig.base.json`
- Strict mode enabled with key flags: `strict: true`, `noImplicitReturns: true`, `noUnusedLocals: true`
- Target: `esnext`, Module resolution: `bundler`
- JSX: `react-native`
- Output includes source maps, declarations, and declaration maps

Per-package `tsconfig.json` typically extends the base:
```json
{
  "extends": "expo-module-scripts/tsconfig.base",
  "compilerOptions": { "outDir": "./build" },
  "include": ["./src"],
  "exclude": ["**/__mocks__/*", "**/__tests__/*"]
}
```

## Coding Conventions

### JavaScript/TypeScript Style

- **Formatter:** Prettier (integrated with ESLint)
  - `printWidth: 100`, `tabWidth: 2`, `singleQuote: true`
  - `bracketSameLine: true`, `trailingComma: "es5"`
- **Linter:** ESLint extending `universe/native`, `universe/node`, `universe/web` (from `eslint-config-universe`)
- **Declarations:** Use `const` by default, `let` only when reassignment is needed. Never use `var`.

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Classes, components | PascalCase | `class CameraView` |
| Functions, variables | camelCase | `function filterWater()` |
| Async functions | camelCase + `Async` suffix | `async function fetchAccountAsync()` |
| Private members | Underscore prefix | `_currentNumber`, `_handlePress` |
| Booleans | `is`/`was`/`did` prefix | `isDeleted`, `didLoad` |
| Types/interfaces | PascalCase | `type CameraProps` |
| Constants (module-level) | camelCase or UPPER_SNAKE_CASE | depends on context |

### Import Ordering

1. Side-effect imports (`import 'side-effect'`)
2. External/node modules (`react`, `react-native`, `path`)
3. Aliased internal modules
4. Relative imports (`../`, `./`)
5. `require()` calls last

Within groups, sort by module name (ASCII order).

### Comments

- `// line comments` for inline explanations
- `/** JSDoc block */` above classes, methods, and exports
- `/* inline */` for mid-line clarifications
- Remove all `console.log` and commented-out code before committing

### Platform-Specific Files

Use file extensions to target platforms:
- `.web.ts` / `.web.tsx` — Web only
- `.ios.ts` / `.ios.tsx` — iOS only
- `.android.ts` / `.android.tsx` — Android only
- `.native.ts` / `.native.tsx` — iOS + Android (not web)

### Swift (iOS)

- Linted with SwiftLint (configuration in `.swiftlint.yml`)
- Native modules defined in `<Name>Module.swift`
- Uses the Expo Modules API (`ExpoModulesCore`)

### Kotlin (Android)

- Native modules in `expo/modules/<name>/` package
- Uses the Expo Modules API (`expo.modules.kotlin`)
- JDK 17 (Zulu recommended)

## Testing

### Unit Tests

- **Framework:** Jest (via `jest-expo` preset or `expo-module-scripts` preset)
- **Location:** `src/__tests__/` within each package
- **Naming:** `*-test.ts`, `*-test.tsx` (also `*.test.ts`)
- **Platform variants:** `*-test.web.ts`, `*-test.ios.ts`, `*-test.native.ts`
- **Running:** `yarn test` from the package directory (interactive platform selector)
- **Jest config:** Most packages use `"jest": { "preset": "expo-module-scripts" }` in `package.json`
- **Mocks:** Native functions must be mocked in `jest-expo` (see `packages/jest-expo/src/preset/`)

### E2E Tests

- **Location:** `apps/test-suite/tests/`
- **Runner:** Custom Jasmine-based runner in `apps/bare-expo`
- **Commands:** `yarn test:android` or `yarn test:ios` from `apps/bare-expo`
- **Adding tests:** New files must be registered in `apps/test-suite/TestUtils.js` and optionally in `apps/bare-expo/e2e/TestSuite-test.native.js`

### Manual/Smoke Tests

- **Location:** `apps/native-component-list/`
- Useful for UI interactions and hard-to-automate scenarios

### Multi-Platform Testing

Tests run across iOS, Android, and web platforms. Some packages (like `expo-router`) configure multi-project Jest configs with `getIOSPreset()`, `getAndroidPreset()`, `getWebPreset()`, `getNodePreset()`.

## CI/CD

CI runs on GitHub Actions with workflows in `.github/workflows/`:

| Workflow | Purpose |
|----------|---------|
| `android-unit-tests.yml` | Android unit tests |
| `android-instrumentation-tests.yml` | Android instrumented tests |
| `ios-unit-tests.yml` | iOS unit tests |
| `test-suite.yml` | Full test suite (bare-expo) |
| `cli.yml` | CLI tests |
| `router-e2e.yml` | Expo Router E2E tests |
| `docs.yml` / `docs-pr.yml` | Documentation builds |
| `swift.yml` | Swift linting |
| `sdk.yml` | SDK-level checks |
| `fingerprint.yml` | Fingerprint checks |

**Tip:** CI runs faster if docs changes and code changes are in separate PRs.

## Git Conventions

### Commit Messages

Format: `[platform][api] Title`

Examples:
- `[ios][video] Fixed black screen bug on older devices`
- `[android][notifications] Add action buttons when not in foreground`

### Branching

- Main branch: `main`
- Develop on feature branches
- Rebase onto `main` (linear history — no merge commits)
- Squash related commits before merging

### Changelog Updates

Every user-facing change must include a CHANGELOG.md entry in the affected package under `## Unpublished`:

```markdown
## Unpublished

### 🎉 New features

- Added example feature. ([#12345](https://github.com/expo/expo/pull/12345) by [@username](https://github.com/username))
```

**Categories** (determines version bump):
- `🛠 Breaking changes` — major bump
- `🎉 New features` — minor bump
- `🐛 Bug fixes` — patch bump
- `⚠️ Notices` — deprecations, behavior changes
- `💡 Others` — internal changes, refactors

### Pre-Submission Checklist

1. `yarn build` — Compile TypeScript in modified packages
2. `yarn lint --fix` — Fix formatting, ensure no errors/warnings
3. `yarn test` — All existing and new tests pass
4. Update `CHANGELOG.md` in affected packages
5. Remove all `console.log` and commented-out code
6. Write a test plan in the PR description

## Environment Setup

### Prerequisites

- **OS:** macOS or Linux (Windows requires WSL)
- **Node:** v22.14.0 (managed via Volta)
- **Ruby:** 3.3+ (for iOS/CocoaPods)
- **JDK:** 17 (Zulu recommended, for Android)
- **direnv:** For automatic environment loading (`.envrc`)
- **git-lfs:** For large binary files

### Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `EXPO_ROOT_DIR` | Set automatically by `.envrc` to repo root |
| `EXPO_USE_SOURCE=1` | Force all Expo modules to compile from source |
| `ANDROID_HOME` / `ANDROID_SDK_ROOT` | Android SDK location |
| `JAVA_HOME` | JDK location |
| `EXPO_NONINTERACTIVE=1` | Run tools in non-interactive/CI mode |

## Key Architecture Notes

- **expo-modules-core:** The foundation for all native modules. Provides the Swift/Kotlin API that native modules use to expose functionality to JavaScript.
- **expo-module.config.json:** Each native module declares its platforms and module class names here. The autolinking system (`expo-modules-autolinking`) uses this to automatically link modules.
- **expo-module-scripts:** Provides the unified `expo-module` CLI used by all packages for building, testing, and linting. Ensures consistent tooling across 100+ packages.
- **React Native fork:** Located at `react-native-lab/react-native` (git submodule). Diverges minimally from upstream.
- **Build output is committed:** All `build/` directories are checked into git so contributors don't need to rebuild every package after checkout.
