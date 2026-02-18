# Development Performance Optimization

## Problem
When running Next.js in development mode (`next dev`), pages are compiled on-demand when you first access them. This can be slow, especially for complex routes.

## Solution: Pre-compile Everything (Recommended)

**Use the pre-compiled dev command to build everything first, then start the dev server:**

```bash
npm run dev:precompiled
```

This command will:
1. **Build all pages and routes** (compiles everything upfront)
2. **Start dev server with Turbo mode** (uses pre-compiled pages)
3. **Enable hot reload** (still works for code changes)

### How It Works

When you run `npm run dev:precompiled`:
- First, it runs `next build` which compiles all pages, routes, and components
- Then, it starts `next dev` which uses the cached compiled pages from the build
- When you access a route, it's already compiled - **no waiting!**
- Hot reload still works for code changes (only changed files recompile)

### Alternative Commands

```bash
# Pre-compile everything then start dev (RECOMMENDED)
npm run dev:precompiled

# Regular dev mode (compiles on-demand, slower first access)
npm run dev

# Production build for local testing (fastest, but no hot reload)
npm run build:prod
```

## Configuration Optimizations

The `next.config.mjs` has been optimized with:

1. **Extended Page Cache**: Pages stay in memory for 25 minutes (instead of 5)
2. **Larger Buffer**: Keeps 50 pages in buffer (instead of 10)
3. **Turbo Mode**: Enabled by default for faster compilation
4. **Package Optimization**: Optimized imports for large libraries

## Performance Tips

1. **First Build**: The initial `next build` takes a few minutes but only needs to run once
2. **Cache Persists**: Next.js caches compiled pages in `.next` folder - don't delete it
3. **Incremental**: After first build, only changed files recompile
4. **Turbo Mode**: Uses Rust-based compiler for faster builds

## When to Rebuild

You only need to rebuild when:
- Adding new routes/pages
- Changing `next.config.mjs`
- Major dependency updates
- Clearing `.next` folder

Otherwise, the cached build is reused and only changed files recompile.

## Workflow Recommendation

**For daily development:**
```bash
# Start your day - pre-compile everything
npm run dev:precompiled

# During the day - just use regular dev (uses cache)
npm run dev
```

**For quick testing:**
```bash
# If you just need to test something quickly
npm run dev
```

The pre-compiled approach gives you the best of both worlds:
- ✅ Fast route access (everything pre-compiled)
- ✅ Hot reload (code changes still work)
- ✅ Development features (error overlays, etc.)
