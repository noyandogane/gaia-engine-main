# Testing Setup Documentation

This document describes the testing framework setup for the modern web application.

## Overview

The project uses a comprehensive testing setup with:

- **Unit Tests**: Vitest + React Testing Library for components and stores
- **E2E Tests**: Playwright for end-to-end testing
- **Coverage**: Vitest coverage with v8 provider

## Unit Testing (Vitest + React Testing Library)

### Configuration
- **Config file**: `vite.config.ts`
- **Test setup**: `src/test-setup.ts`
- **Test pattern**: `*.test.ts`, `*.test.tsx`
- **Environment**: jsdom

### Running Unit Tests
```bash
# Run all tests with coverage
npm run test

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- Component tests: `src/app/*.test.tsx`
- Store tests: `src/stores/*.test.ts`
- Utility tests: `src/utils/*.test.ts`, `src/sim/*.test.ts`

### Mocking
- Three.js is mocked in test setup for 3D components
- Canvas context is mocked
- Stores are mocked using vi.mock()

## E2E Testing (Playwright)

### Configuration
- **Config file**: `playwright.config.ts`
- **Test directory**: `tests/e2e/`
- **Browsers**: Chromium (headless)
- **Dev server**: Starts automatically on `http://localhost:5173`

### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Test Structure
- Smoke tests: `tests/e2e/smoke.spec.ts`
- Feature tests: Additional `.spec.ts` files in `tests/e2e/`

## Coverage Reporting

Coverage is automatically generated when running `npm run test` and includes:
- **Text output**: Console summary
- **HTML report**: `coverage/index.html`
- **JSON report**: `coverage/coverage-final.json`
- **Cobertura XML**: `coverage/cobertura-coverage.xml` (for CI)

### Coverage Configuration
- Provider: v8
- Excluded files:
  - `node_modules/`
  - `src/test-setup.ts`
  - `**/*.d.ts`
  - `**/*.config.*`
  - `**/coverage/**`
  - `tests/e2e/**`

## CI/CD Integration

### GitLab CI
- **Unit tests**: Run on merge requests and main branch
- **E2E tests**: Run on merge requests and main branch
- **Coverage**: Collected and reported for unit tests
- **Artifacts**: Coverage reports stored for 1 week

### Test Commands in CI
```bash
# Unit tests with coverage
npm run test

# E2E tests
npm run test:e2e
```

## Best Practices

### Unit Tests
1. **Test files**: Co-locate with source files using `.test.ts` or `.test.tsx` extension
2. **Test IDs**: Use `data-testid` attributes for elements that need to be selected in tests
3. **Mocking**: Mock external dependencies (Three.js, canvas, network requests)
4. **Store testing**: Test Zustand stores independently with proper state management

### E2E Tests
1. **Wait strategies**: Use explicit waits rather than fixed timeouts where possible
2. **Selectors**: Prefer accessible selectors (aria-label, role) over CSS selectors
3. **Test isolation**: Each test should be independent and clean
4. **Headless mode**: Tests run in headless mode for CI

### Coverage
1. **Thresholds**: Aim for >70% coverage on new code
2. **Focus**: Prioritize coverage for critical paths and business logic
3. **Review**: Check coverage reports to identify untested code

## Example Tests

### Component Test
```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByTestId('my-component')).toBeInTheDocument()
  })
})
```

### Store Test
```typescript
import { describe, expect, it, beforeEach } from 'vitest'
import { useMyStore } from './myStore'

describe('myStore', () => {
  beforeEach(() => {
    useMyStore.setState({ /* initial state */ })
  })

  it('updates state correctly', () => {
    const store = useMyStore.getState()
    store.someAction()
    expect(useMyStore.getState().someValue).toBe(expected)
  })
})
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test'

test('user can navigate', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()
  await page.click('button[type="submit"]')
  await expect(page.getByText('Success')).toBeVisible()
})
```

## Troubleshooting

### Common Issues
1. **Three.js errors**: Ensure proper mocking in test setup
2. **Canvas rendering**: Mock canvas context for component tests
3. **Store persistence**: Mock localStorage for store tests
4. **E2E timeouts**: Increase wait times for slow-loading components

### Debug Commands
```bash
# Debug unit tests
npm run test:watch -- --no-coverage

# Debug E2E tests
npm run test:e2e:ui

# Run specific test file
npm run test src/app/App.test.tsx
```