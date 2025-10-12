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

## CI/CD and Hosting

- **GitHub Actions**: A tool for continuous integration (CI). Used to automatically run tasks (tests, linting, type checking) with every pull request to ensure code quality.
- **Vercel**: A platform for hosting and continuous deployment (CD), optimized for Next.js. It provides automatic production deployments and preview environments for each pull request.
