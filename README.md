# Modern Web App Scaffold

[![pipeline status](https://gitlab.com/your-username/your-repo/-/badges/main/pipeline.svg)](https://gitlab.com/your-username/your-repo/-/commits/main)
[![coverage report](https://gitlab.com/your-username/your-repo/-/jobs/main/artifacts/download?job=unit-tests)](https://gitlab.com/your-username/your-repo/-/pipelines)

> **Note:** Update the badge URLs above with your actual GitLab repository details (replace `your-username/your-repo` with your namespace/project path)

A baseline Vite + React + TypeScript project wired with linting, formatting, and pre-commit
quality gates. Use this repository as the starting point for building simulation, rendering, and
UI features across the `app/`, `ui/`, `sim/`, and `render/` domains.

## Requirements

- Node.js 20 (see [`.nvmrc`](./.nvmrc))
- npm 10 or newer (feel free to substitute pnpm or yarn if preferred)

## Getting started

```bash
# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```

The placeholder page showcases the configured tooling and links to documentation. Hot Module
Replacement (HMR) is enabled by default.

## Available scripts

| Command                | Purpose                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Launches the Vite development server on <http://localhost:5173>.  |
| `npm run build`        | Type-checks and builds the application for production in `dist/`. |
| `npm run preview`      | Serves the production build locally.                              |
| `npm run lint`         | Runs ESLint with zero-warnings enforcement.                       |
| `npm run lint:fix`     | Lints and automatically fixes resolvable issues.                  |
| `npm run format`       | Formats the entire project with Prettier.                         |
| `npm run format:check` | Checks formatting without writing changes.                        |
| `npm run typecheck`    | Validates TypeScript types using `tsconfig.app.json`.             |

## Project structure

```
src/
├── app/        # Application entry point and high-level orchestration
├── assets/     # Static assets bundled by Vite
├── render/     # Rendering utilities and adapters
├── sim/        # Simulation modules and domain logic
└── ui/         # Reusable UI primitives and styles
```

Path aliases are configured in both Vite and TypeScript:

- `@/` → `src/`
- `@app/`, `@ui/`, `@sim/`, `@render/`, `@assets/`

Import modules using these aliases to keep imports concise and intention-revealing:

```ts
import { App } from '@app'
import reactLogo from '@assets/react.svg'
```

## CI/CD Pipeline

This project includes a GitLab CI pipeline that enforces quality gates on every merge request and push to the main branch:

| Stage   | Job             | Purpose                                          |
| ------- | --------------- | ------------------------------------------------ |
| validate| `install`       | Cache dependencies for all jobs                  |
| validate| `lint`          | Run ESLint with zero-warnings enforcement        |
| validate| `type-check`    | Validate TypeScript types                        |
| test    | `unit-tests`    | Run unit tests with coverage reporting           |
| test    | `e2e-tests`     | Playwright E2E tests (stub job, allowed to fail) |
| build   | `build`         | Build production artifact                        |

The pipeline ensures that failing lint or tests will block merges by default. Build artifacts are downloadable from the CI job page.

## Tooling highlights

- **Vite** powers the dev server and build pipeline with ESBuild and Rollup under the hood.
- **React 19 + TypeScript** deliver a modern component model with static typing.
- **ESLint (`typescript-eslint`)** enforces code quality with React-specific rules.
- **Prettier** keeps formatting consistent across JavaScript, TypeScript, JSON, and CSS files.
- **Husky + lint-staged** run linting and formatting on staged files before each commit.
- **GitLab CI** provides automated quality gates and artifact deployment.
- **.editorconfig** and **.nvmrc** document shared editor and runtime preferences.

## Next steps

- Build out domain-specific modules in `sim/` and `render/`.
- Extend the UI component library inside `ui/`.
- Add routes, state management, or data fetching as your application evolves.

For more details, explore the official documentation:

- [Vite Documentation](https://vite.dev/guide/)
- [React Documentation](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [typescript-eslint](https://typescript-eslint.io/)
- [Prettier](https://prettier.io/)
- [Husky](https://typicode.github.io/husky/)
