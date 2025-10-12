# Pathly

Pathly is a Progressive Web App (PWA) designed for mountain hiking enthusiasts to aid in obtaining the PTTK Mountain Tourist Badge (GOT). It serves as a digital companion to the official paper logbook, simplifying point calculation, tracking unique routes, and managing personalized route catalogs.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Pathly aims to solve the challenges faced by hikers documenting their trips for the PTTK Mountain Tourist Badge. While the official paper logbook remains mandatory, Pathly provides a digital layer to streamline the process.

The app's core functionality includes:

- **GPX File Import**: Automatically analyzes route data such as date, distance, ascents, descents, and duration.
- **Manual Data Entry**: Allows users to add mandatory information required by GOT regulations, like points, and include personal notes.
- **Personalized Catalogs**: Enables the creation and management of custom route collections (e.g., "Favorite routes," "Trips with children").

Pathly is designed for both modern, tech-savvy tourists and experienced badge collectors seeking a more convenient way to manage their hiking achievements.

## Tech Stack

The project is built with a modern, full-stack TypeScript architecture.

| Category            | Technologies                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**        | [Next.js](https://nextjs.org/) 15, [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/) 5, [Tailwind CSS](https://tailwindcss.com/) 4, [Shadcn/ui](https://ui.shadcn.com/) |
| **Backend (BaaS)**  | [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Auto-generated APIs)                                                                                                                 |
| **CI/CD & Hosting** | [GitHub Actions](https://github.com/features/actions), [Vercel](https://vercel.com/)                                                                                                                |

## Getting Started Locally

To run the project on your local machine, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) version **22.15.0**
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/Vesperalin/Pathly.git
    cd pathly
    ```

2.  **Install dependencies:**

    ```sh
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add your Supabase project credentials. You can find these in your Supabase project's API settings.

    ```sh
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Available Scripts

The following scripts are available in the `package.json`:

| Script       | Description                                            |
| ------------ | ------------------------------------------------------ |
| `dev`        | Starts the development server with Turbopack.          |
| `build`      | Builds the application for production.                 |
| `start`      | Starts the production server.                          |
| `lint`       | Runs the linter to check for code quality issues.      |
| `lint:fix`   | Runs the linter and automatically fixes issues.        |
| `typecheck`  | Runs the TypeScript compiler to check for type errors. |
| `format`     | Checks for formatting issues with Prettier.            |
| `format:fix` | Formats the code with Prettier.                        |
| `check:all`  | Runs both the linter and formatter checks.             |
| `fix:all`    | Runs both the linter and formatter to fix all issues.  |
| `clean`      | Removes the `.next` build directory.                   |

## Project Scope

### Key Features (MVP)

- **User Authentication**: Secure registration and login with email and password.
- **Internationalization**: Support for Polish and English languages.
- **Theme Customization**: Light, dark, and system theme options.
- **Predefined Catalogs**: Default, non-deletable catalogs for GOT badges (Popular, Bronze, Silver, Gold).
- **Custom Catalogs**: Full CRUD functionality for user-created route catalogs.
- **Route Management**: Full CRUD functionality for routes, with data parsed from GPX files.
- **PWA Support**: Installable on mobile and desktop devices.

### Future Features (Post-MVP)

- Social authentication (Google, etc.).
- Password recovery functionality.
- Route sharing and collaboration.
- Interactive map visualizations.
- Data export to PDF.
- Support for additional hiking badges.
- Offline mode.

## Project Status

The project is currently **in development**. The immediate focus is on delivering the Minimum Viable Product (MVP) features outlined above.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
