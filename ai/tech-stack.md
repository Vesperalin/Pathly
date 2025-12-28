# Application Tech Stack

This document describes the key technologies used in the Pathly project to ensure a consistent understanding of the architecture.

## Frontend

- **Next.js 15**: A React framework for building full-stack applications. It manages routing, server-side rendering (SSR), and client-side rendering (CSR).
- **React 19**: A library for building user interfaces (UI) based on a component architecture.
- **TypeScript 5**: A superset of JavaScript that adds static typing for greater security and better code quality.
- **Tailwind CSS 4**: A utility-first CSS framework for quickly styling the interface directly in component files.
- **Shadcn/ui**: A library of pre-built UI components integrated with Tailwind CSS, supporting themes (light/dark) and high accessibility (a11y).

## Backend (BaaS)

- **Supabase**: An open-source Backend-as-a-Service (BaaS) platform that provides key backend services.
- **PostgreSQL Database**: The main database for data storage, using Row Level Security (RLS) to ensure that users only have access to their own resources.
- **Authentication**: A built-in system for user management (registration, login) based on email and password.
- **Auto-generated API**: Automatically provides an API for interacting with the database, which significantly speeds up the development of CRUD operations.

## Testing

### Unit & Integration Tests

- **Vitest**: A modern testing framework optimized for TypeScript/JavaScript and Vite, serving as a Jest replacement. Used for unit and integration tests of components, hooks, and business logic.
- **@testing-library/react**: A library for testing React components with a focus on user interactions and accessibility.
- **@testing-library/jest-dom**: Provides custom matchers for DOM assertions, making tests more readable and maintainable.
- **@vitejs/plugin-react**: A Vitest plugin enabling proper React component testing with JSX/TSX support.
- **vitest-canvas-mock**: A mock for the canvas API, essential for testing GPX file parsing functionality.
- **Mock Service Worker (MSW)**: A tool for mocking HTTP requests, enabling isolated testing of API interactions without hitting real endpoints.

### End-to-End Tests

- **Playwright**: A modern E2E testing framework supporting multiple browsers and device emulation. Used for testing complete user flows in real browser environments, including PWA functionality and mobile scenarios.
- **@axe-core/playwright**: An accessibility testing library integrated with Playwright, ensuring WCAG 2.1 AA compliance by detecting accessibility violations.

### Other Testing Tools

- **Lighthouse CI**: (Optional, for later) An automated tool for auditing performance, PWA compliance, and best practices. Can be added when needed for production audits.
- **k6**: (Optional, for later) A performance testing tool for load testing Supabase API endpoints and measuring system behavior under high traffic.
- **OWASP ZAP (Zaproxy)**: (Optional, for later) A security scanning tool for detecting vulnerabilities like XSS, CSRF, and other security issues.
- **Codecov**: A code coverage reporting tool that tracks test coverage across the codebase.
- **Supabase CLI**: Used for local Supabase instance management, enabling automated database resets and migration testing with `supabase db reset`.

## CI/CD and Hosting (do skonfigurowania później)

- **GitHub Actions**: A tool for continuous integration (CI). Will be used to automatically run tasks (tests, linting, type checking) with every pull request to ensure code quality.
- **Vercel**: A platform for hosting and continuous deployment (CD), optimized for Next.js. It provides automatic production deployments and preview environments for each pull request.
