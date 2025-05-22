# Nuxt Dashboard Template with Nuxt UI Pro

This Nuxt 3 dashboard application provides a comprehensive suite of features for managing your business operations. Key functionalities include customer management, an integrated inbox/messaging system, user-configurable settings, team management capabilities, a notification system, and data visualization through charts. This project is built with [Nuxt UI Pro](https://ui.nuxt.com/getting-started/installation/pro/nuxt).

[Live Demo](https://dashboard-template.nuxt.dev)

<a href="https://dashboard-template.nuxt.dev" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/57f6d964-a76c-4662-96b2-17622fb18d40">
    <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/c4c87f77-d10a-4731-9b7c-0cd0ff4821d7">
    <img alt="Nuxt Dashboard with Nuxt UI Pro" src="https://github.com/user-attachments/assets/c4c87f77-d10a-4731-9b7c-0cd0ff4821d7">
  </picture>
</a>

## Features

- Customer Relationship Management (CRM)
- Internal Messaging System (Inbox)
- Customizable User Settings
- Team and Member Management
- Notification System
- Data Visualization with Charts
- Light & Dark Mode
- Command Palette
- Keyboard Shortcuts
- Collapsible Sidebar

## Project Structure

Here's a brief overview of the main directories in this project:

- **`app/`**: Contains the core application code.
    - **`components/`**: Houses reusable Vue components.
    - **`pages/`**: Contains the Nuxt.js page components for different routes.
    - **`composables/`**: Stores Nuxt 3 composables (reusable reactive functions).
    - **`layouts/`**: Defines the different layouts for the application pages.
    - **`assets/`**: Stores static assets like CSS and images.
    - **`utils/`**: Contains utility functions.
- **`server/`**: Holds server-side API endpoints and middleware.
    - **`api/`**: Contains the API route handlers.
- **`public/`**: Stores publicly accessible files like `favicon.ico`.

## Customization

This dashboard is built to be extensible. Here are some ways to customize and add your own features:

- **Adding New Pages:** Create new `.vue` files within the `app/pages/` directory. Nuxt 3 will automatically generate routes based on the file structure.
- **Creating Components:** Develop reusable UI elements as Vue components and place them in the `app/components/` folder.
- **Extending Functionality:** For new reactive logic or state management, create composable functions in the `app/composables/` directory.
- **Modifying API Endpoints:** Customize or add new server-side logic by editing files in `server/api/` or creating new route handlers.
- **Theming and Styling:** Global styles can be modified in `app/assets/css/main.css`. Nuxt UI Pro components offer extensive theming capabilities; refer to the [Nuxt UI Pro documentation](https://ui.nuxt.com/pro/getting-started/theming) for more details.

## Vue Dashboard Template

The dashboard template for Vue is on https://github.com/nuxt-ui-pro/dashboard-vue

## Quick Start

```bash [Terminal]
npx nuxi@latest init -t github:nuxt-ui-pro/dashboard
```

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Renovate integration

Install [Renovate GitHub app](https://github.com/apps/renovate/installations/select_target) on your repository and you are good to go.
