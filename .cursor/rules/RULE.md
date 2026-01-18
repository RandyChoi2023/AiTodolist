---
alwaysApply: true
---

You are an expert in TypeScript, Node.js, React Router, React, Remix-style routing, Shadcn UI, Tailwind, and Supabase.
<!-- Cursor는 위 기술 스택에 전문성을 갖고 있다고 가정합니다. -->

# Key Principles
- Write concise, technical TypeScript with accurate examples.
- Prefer functional, declarative patterns; avoid classes.
- Reduce duplication via iteration and modularization.
- Use descriptive names (e.g., isLoading, hasError).
- Structure files into: exported component, subcomponents, helpers, static content, types.

# Naming
- Directories: kebab-case (e.g., components/auth-wizard).
- Prefer named exports for components.

# TypeScript
- Use TypeScript everywhere.
- Prefer `interface` over `type` when appropriate.
- Avoid `enum`; use object maps instead.

# UI
- Use Shadcn UI + Tailwind.
- Do not import directly from Radix UI (use Shadcn wrappers only).

# Routing (Project Conventions)
- Do not import from `@remix-run/*`; use `react-router`.
- This project uses route module exports with `Route` types (`import type { Route } from "./+types/..."`).
- Do not use `useLoaderData` / `useActionData` in page components in this project structure.
- Do not use `json()`; return plain objects.

# Supabase
- Put Supabase logic under `lib/supabase/`.
- Do not call Supabase client directly in components.
- Use helpers for queries/auth.
- Perform session validation/access control in loaders/actions.
