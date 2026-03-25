# Local development — slow “compiling” on every page

## What you’re seeing

With **`npm run dev`** (Next.js + Turbopack), routes are **compiled on demand** the first time you open them. That’s normal: there is no built-in “compile every page once” in **dev** mode.

So the first visit to `/telemedicine/...`, `/inpatient`, etc. can sit on **“Compiling…”** for a while. While that happens:

- The **browser may still run other work** (e.g. the Zoom embed loading scripts and showing **“joining”**).
- **API calls** from the shell (header, layout, session) can finish, fail, or appear to “time out” depending on timing — that’s separate from the Zoom UI, which keeps its own loading state.

That mismatch (header / layout unhappy, video area still “joining”) is often **dev compilation + parallel async work**, not a single broken timeout.

## Run with everything pre-built (recommended for Telemedicine / Zoom)

To avoid per-route dev compilation, use a **production** server locally — all app routes are built up front:

```bash
npm run preview
```

Listens on **port 3000** (same as default `next dev`). Then open `http://localhost:3000`.

Other port (e.g. to match Docker or API docs):

```bash
npm run preview:3003
```

- **First run:** `next build` can take several minutes (same as production).
- **After that:** navigation is fast; no “Compiling…” overlay on each page.

Use **`preview`** when testing **embedded Zoom**, long flows, or anything that felt flaky under **`dev`**.

## Still use `dev` for daily coding

```bash
npm run dev
```

After you’ve visited a page once in a session, Turbopack usually keeps it **hot**; slowness is mostly **first touch** of each route.

## Scripts reference

| Script | Purpose |
|--------|--------|
| `npm run dev` | Dev server, compile on demand, HMR |
| `npm run preview` | `build` + `next start` — all routes precompiled, port 3000 |
| `npm run preview:3003` | Same, port 3003 |
| `npm run build` | Production build only |
| `npm run start` / `start:prod` | Run **after** `build` (production server) |

## API + Next.js

Ensure **`NEXT_PUBLIC_API_URL`** points at your Node API (e.g. `http://localhost:3003`) when the UI is not served from the same origin as the API, and restart Next after changing env.

---

See also: `docs/TELEMEDICINE_ZOOM_EMBEDDED.md` (Zoom embed, timeouts, Strict Mode).
