# Command: ship

## Pre-ship Checklist

### Code
- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` clean
- [ ] `npm run type-check` clean (no TypeScript errors)
- [ ] No `console.log` left in production code
- [ ] No `TODO` comments blocking the feature

### Environment
- [ ] All required env vars documented in `.env.example`
- [ ] `ANTHROPIC_API_KEY` present and valid
- [ ] File size limits configured correctly

### UX
- [ ] Run `/review-ui` checklist
- [ ] Test with a real image upload (not just mocks)
- [ ] Test error states (invalid file, network failure)
- [ ] Test on mobile Safari (most likely to have drag-and-drop quirks)

### Commit
Format: `TI-XXX: Description (YYYY-MM-DD)`
Co-Authored-By: Dylan Cole
