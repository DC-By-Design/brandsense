# API Rules

## Route Structure
All routes under `app/api/`. Each route = one file, one responsibility.

```
app/api/
  upload/route.ts       → accept file, return { id, type, url }
  analyse/route.ts      → run analysis pipeline, stream results
  extract-brand/route.ts → parse brand PDF, return brand tokens
  inspect-url/route.ts  → screenshot + analyse URL
```

## Response Shape
Always return:
```ts
type ApiSuccess<T> = { data: T; error: null }
type ApiError = { data: null; error: { message: string; code: string } }
```

Never expose stack traces. Never expose internal paths.

## Validation
- Every route validates with Zod at the boundary.
- Reject early — validate before any async work.
- File uploads: validate MIME type AND file extension (they can differ).

## Streaming Analysis
- Use `ReadableStream` + `new Response(stream)` for analysis routes.
- Stream partial results as newline-delimited JSON (NDJSON).
- Client consumes with `EventSource` or fetch + `ReadableStream`.

## Error Handling
- Use a shared `ApiError` class in `lib/errors.ts`.
- HTTP status codes: 400 (bad input), 413 (file too large), 422 (unsupported type), 500 (internal).
- Log errors server-side with context. Never log PII.

## Claude API Usage
- All AI calls in `lib/analysis/` — never directly in route handlers.
- Use `claude-sonnet-4-6` model.
- Always set a max_tokens limit appropriate to the task.
- System prompts live in `lib/prompts/` — never inline in route handlers.
