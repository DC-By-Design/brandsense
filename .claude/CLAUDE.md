# Preflight — Claude Instructions

## What This Is
A premium creative asset review tool. Upload-first. Sharp feedback. No fluff.

## Stack
- Next.js 15 App Router, TypeScript strict, Tailwind CSS, shadcn/ui
- Zustand (client state), Zod (validation), @phosphor-icons/react (icons only)
- Claude API (claude-sonnet-4-6) as the analysis backbone

## Rules Index
- Frontend: `.claude/rules/frontend.md`
- API: `.claude/rules/api.md`
- Analysis: `.claude/rules/analysis.md`

## Skills Index
- Writing critique output: `.claude/skills/critique.md`
- Brand matching logic: `.claude/skills/brand-match.md`

## Core Constraints
1. No `any` types. Ever.
2. Dark mode default, light mode must work.
3. Analysis functions return structured JSON — never raw strings.
4. Keep components under 200 lines. Extract if larger.
5. No generic AI language in output copy ("Great job!", "Impressive work").

## Commit Format
TI-XXX: Description (YYYY-MM-DD)
Co-Authored-By: Dylan Cole
