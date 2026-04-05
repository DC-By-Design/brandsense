# Frontend Rules

## Component Patterns
- Server Components by default. Add `"use client"` only when needed (interactivity, hooks, browser APIs).
- Co-locate component styles with the component. No global CSS except base resets.
- Compound components over boolean prop proliferation. If you have >3 boolean props, redesign.
- All icons from `@phosphor-icons/react`. No other icon libraries.

## Tailwind
- Use `cn()` from `@/lib/utils` for conditional classes.
- No inline `style` props unless for dynamic values Tailwind can't handle (e.g. CSS variables for dynamic colours).
- Dark mode via `dark:` prefix. Test both.
- Spacing scale: stick to 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).

## State Management
- `useReviewStore` handles the full review lifecycle: idle → uploading → analysing → results.
- Local component state (`useState`) for UI-only concerns (hover, open/closed).
- Do not store derived data in Zustand — compute it.

## Upload Component
- Drag-and-drop via native HTML5 API (no libraries needed for basic DnD).
- Validate file type + size client-side before upload.
- Accepted: jpg, jpeg, png, webp, pdf, mp4, mov, webm.
- Max file size: 50MB.

## Results UI
- Summary always visible at top.
- Sections are collapsible — closed by default except the top 3 (Strengths, Risks, Fix Next).
- Confidence indicators: dot or subtle label, never a raw percentage.
- Scores: use the 4-tier system (Strong / Good with risks / Needs work / High risk).

## Animation
- Use CSS transitions over JS animation libraries where possible.
- Framer Motion is allowed for complex enter/exit animations only.
- Respect `prefers-reduced-motion`.
