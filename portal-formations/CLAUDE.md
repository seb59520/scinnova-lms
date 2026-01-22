# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portal Formations is a learning management system (LMS) built with React/TypeScript frontend and Supabase backend. It supports three user roles: student (learner), trainer (instructor), and admin.

**Key Concept**: A **Formation** (course) is standalone educational content, while a **Programme** groups multiple formations in a structured learning path.

## Development Commands

```bash
# Frontend (Vite dev server at localhost:5173)
npm run dev

# Backend Express server (localhost:3001, Swagger at /docs)
npm run dev:server
# or: cd server && npm run dev

# Build production
npm run build

# Lint (max 100 warnings allowed)
npm run lint
```

Both servers are needed for full functionality. Run them in separate terminals or use `./start-all-servers.sh`.

## Architecture

### Monorepo Structure
- `src/` - React frontend (Vite + TypeScript)
- `server/` - Express.js backend for specialized operations (PDF generation, course processing)
- `supabase/migrations/` - Database migrations

### Frontend Organization
- `src/components/` - Reusable React components
- `src/pages/` - Route pages organized by role (`admin/`, `trainer/`, top-level for learners)
- `src/hooks/` - Custom React hooks (data fetching, auth, real-time)
- `src/lib/` - Utilities including `supabaseClient.ts`
- `src/types/` - TypeScript definitions including `database.ts` for Supabase types

### State Management
Uses React Context API with custom hooks (no Redux). Key providers in `App.tsx`:
- `AuthProvider` - Authentication and user profile
- `TimeTrackingProvider` - User activity tracking
- `GammaPresentationProvider` - Presentation viewer state

### Routing
React Router v6 with role-based protection via `ProtectedRoute` component. Routes are defined in `src/App.tsx`.

### Data Layer
- Direct Supabase client calls from hooks/components
- Real-time subscriptions for live updates
- RLS (Row Level Security) enforced on all tables
- Authentication: Email/password, Google OAuth (PKCE), anonymous "ghost" login

## Key Patterns

### Supabase Queries
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('field', value)
  .maybeSingle()
```

### Protected Routes
```tsx
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <Component />
  </ProtectedRoute>
}/>
```

### Custom Hooks
All hooks start with `use` and encapsulate Supabase queries. Common ones: `useAuth()`, `useUserRole()`, `useTimeTracking()`, `useChat()`, `usePresence()`.

## Tech Stack

**Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS, TipTap (rich text), React PDF, Lucide icons

**Backend**: Express.js, Puppeteer (PDF generation), Swagger UI

**Database**: Supabase (PostgreSQL with real-time, auth, storage)

## Environment Variables

Frontend uses `VITE_` prefix:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server uses standard env vars loaded via dotenv.
