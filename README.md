# HireMe – Frontend

**HireMe** helps job seekers find the right roles. Upload your resume for AI-powered matching, browse jobs with cursor-based infinite scroll, and save your favourites.

## Features

- **AI Job Search** – Upload a resume (PDF/DOCX/TXT); get matched jobs ranked by relevance (semantic + skills + experience).
- **Browse jobs** – Cursor-paginated list with virtual scrolling; filter by domain.
- **Saved jobs** – Sign up, log in, and save jobs to a personal list.
- **Responsive UI** – React + TypeScript + shadcn/ui + Tailwind CSS.

## Tech stack

- **Vite** – Build and dev server
- **React 18** + **TypeScript**
- **React Router** – Client-side routing
- **TanStack Query** – Server state and caching
- **TanStack Virtual** – Virtualised lists for long job lists
- **shadcn/ui** + **Tailwind CSS** – UI components and styling

## Local development

**Requirements:** Node.js and npm (or use [nvm](https://github.com/nvm-sh/nvm)).

```sh
# Clone the repo
git clone https://github.com/Sakshamyadav19/HireMe_Frontend.git
cd HireMe_Frontend

# Install dependencies
npm install

# Start the dev server (with hot reload)
npm run dev
```

The app will run at `http://localhost:5173` (or the port Vite prints). Point the frontend at your HireMe backend API (e.g. via env or `vite.config.ts` proxy).

## Scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint               |
| `npm run test` | Run tests                |

## Repository

- **Frontend:** [HireMe_Frontend](https://github.com/Sakshamyadav19/HireMe_Frontend) (this repo)
- Backend is in a separate repository; configure its URL for API requests.
