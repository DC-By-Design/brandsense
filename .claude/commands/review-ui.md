# Command: review-ui

## Purpose
Review the current UI against Preflight's product principles before shipping.

## Checklist
Run through each item and flag any failure:

### Premium Feel
- [ ] No unnecessary borders or dividers
- [ ] Strong typographic hierarchy (3 levels max visible at once)
- [ ] Generous spacing — nothing cramped
- [ ] Micro-interactions feel intentional, not decorative

### Clarity
- [ ] Can a new user understand what to do in <5 seconds?
- [ ] Is the primary action obvious?
- [ ] Are error states clear and actionable?

### Dark/Light Mode
- [ ] Test both modes
- [ ] No white-on-white or black-on-black
- [ ] Colour contrast passes WCAG AA minimum

### Responsiveness
- [ ] Mobile (375px), tablet (768px), desktop (1280px)
- [ ] Upload zone usable on touch
- [ ] Results readable on small screens

### Performance
- [ ] No layout shift on load
- [ ] Images optimised (next/image)
- [ ] No unnecessary re-renders (check with React DevTools)

## Output
Report back: Pass / Fail per section. Flag specific components that need fixing.
