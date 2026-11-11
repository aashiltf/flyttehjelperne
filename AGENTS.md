# Flyttehjelpen — development guide

## System context

Flyttehjelpen is a web application intended to help users with moving-related tasks. The repository currently contains a minimal React Router starter application, so do not assume that domain workflows, APIs, authentication, or persistence already exist. When implementing a feature, clarify missing business rules rather than inventing important behavior.

## Technology and architecture

- React 19 with TypeScript in strict mode.
- React Router 8 in framework mode, with server-side rendering enabled.
- Vite for development and builds.
- Tailwind CSS 4 for styling.
- Node.js with ESM modules.
- Route files live in `app/routes/` and are registered in `app/routes.ts`.
- `app/root.tsx` owns the document shell, global links, scripts, scroll restoration, and the application error boundary.
- The `~/*` TypeScript alias points to `app/*`.
- Generated React Router types are written under `.react-router/`; do not edit generated files.

## Working agreements

1. Inspect the existing implementation before changing it. Preserve user changes and follow the patterns already present in the repository.
2. Keep changes focused. Avoid introducing a new library, architectural layer, or state-management solution unless the requirement justifies it.
3. Use TypeScript types instead of `any`. Keep route loader/action data typed through React Router's generated route types.
4. Prefer React Router loaders and actions for route data loading and mutations. Keep server-only code out of client bundles and use the appropriate `.server` conventions when needed.
5. Keep components small and composable. Extract reusable UI into a clearly named component when it is used in more than one place or has meaningful independent behavior.
6. Use semantic HTML and accessible form controls. Every input needs a label, interactive elements must be keyboard usable, focus states must remain visible, and errors must be understandable to screen readers.
7. Design mobile-first. Verify layouts at narrow and wide viewports, and do not rely on color alone to communicate state.
8. Use Tailwind utilities consistently with the existing styling approach. Avoid unnecessary inline styles and avoid replacing global styles for a local concern.
9. Treat user data as sensitive by default. Never commit secrets, tokens, personal data, or environment-specific credentials. Validate and sanitize data at boundaries.
10. Add loading, empty, validation-error, and failure states for asynchronous or user-submitted flows. Do not hide errors or silently discard user input.
11. Preserve SSR compatibility: do not access `window`, `document`, or browser-only APIs during server rendering. Guard browser-only behavior appropriately.
12. Update page metadata with the route's `meta` export when adding or changing a page. Use the correct language and descriptive titles.

## Typical workflow

From the repository root:

```bash
npm install                 # first setup or after dependency changes
npm run dev                 # local development with HMR
npm run typecheck           # generate route types and run TypeScript
npm run build               # production build
npm start                   # serve the production build
```

There is currently no test script or testing framework configured. For non-trivial behavior, add appropriate tests as part of the feature rather than assuming tests exist. At minimum, run `npm run typecheck` and `npm run build` before considering a change complete. Manually verify the affected user flow in the development server when UI behavior changes.

## Route and data conventions

- Add a route module under `app/routes/` and register it in `app/routes.ts`.
- Import the generated route type from the route's `./+types/<route-name>` module when defining `loader`, `action`, `meta`, or component props.
- Use route-level `loader` functions for reads and `action` functions for writes; use `<Form>` or fetchers for progressive-enhancement-friendly interactions.
- Return meaningful HTTP statuses and user-facing validation messages from server-side operations.
- Keep secrets and external-service calls on the server. Read configuration from environment variables and document required variables without committing values.

## Definition of done

A change is ready when:

- The requested behavior works for the normal path and relevant edge cases.
- TypeScript is strict-clean and the production build succeeds.
- The UI is responsive, semantic, keyboard accessible, and has appropriate pending/error/empty states.
- SSR is not broken and no browser-only API is used during rendering.
- New or changed routes have accurate metadata and are registered correctly.
- Documentation and environment-variable requirements are updated when applicable.
- The final response briefly summarizes the change and the validation performed, including any known limitations.
