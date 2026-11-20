ProxCommander is an Expo app (iOS, Android, web) for managing Proxmox VE clusters. The web build is hosted as static files on Cloudflare (assets only, no Worker).

## Expo has changed: don't trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS, or React Native API:

1. Read the major version of `expo` in `package.json` (currently SDK 58).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, start from https://docs.expo.dev/llms.txt and follow its links. Never answer from memory.

## Commands

pnpm only; never `npm`, `yarn`, `bun` or `npx` for project dependencies.

```bash
pnpm expo install <pkg>   # add a dependency (resolves SDK-compatible versions)
pnpm web                  # web dev server
pnpm proxy                # dev CORS proxy for a real PVE host (PVE_PROXY_INSECURE=1 for self-signed)
pnpm web:pve              # web dev server routed through that proxy
pnpm ios / pnpm android   # native dev
pnpm typecheck            # tsc --noEmit
pnpm build:web            # static export to dist/
pnpm exec expo-doctor     # dependency and config checks
```

Run `pnpm typecheck` and `pnpm build:web` before calling a task done.

## Stack

Expo SDK 58 (React Native 0.88, React 19.3, New Architecture), React Native Reusables on Uniwind (Tailwind v4) for UI, TanStack Query for server state, zustand for client state. Expo Router (`main` is `expo-router/entry`) with typed routes (generated into `.expo/types` by `pnpm web` / `pnpm ios`; typecheck also passes without them, just less strictly); no `@expo/ui`, so don't add it without asking.

## Architecture (`src/`)

- `app/`: Expo Router routes (found automatically in `src/app`). `_layout.tsx` holds the providers, `global.css` and `PortalHost`. Routes are thin: they read params and wire navigation into the components in `screens/`.
  - `/`: welcome and cluster list; `?signIn=<loginId>` opens the sign-in dialog.
  - `/clusters/new`: add a cluster and its first login.
  - `/clusters/[clusterId]?login=<loginId>`: the cluster as one login (default: its first signed-in login).
- `storage/backends.ts`: key-value backends and persistence levels: `memory`, `tab` (web sessionStorage), `device` (web localStorage / native keychain). `appData` holds non-secret data. `isStaticRender` is true while the web build pre-renders in Node.
- `storage/secrets.ts`: remembered passwords and token secrets; native keychain only, no-op on web.
- `models.ts`: `Cluster` (ordered `endpoints`, `rememberHostnames`) and `Login` (user@realm, password or API token, `rememberUsername`, `rememberSecret`, `sessionPolicy`).
- `state/profiles.ts`: zustand store of clusters and logins; persists only remembered entries.
- `session/`: `policy.ts` (timeout rules and presets), `sessions.ts` (sign in/out, renewal, idle and max-age expiry, many logins signed in at once), `vault.ts` (per-session storage at its persistence level), `request.ts` (authenticated calls), `SessionProvider.tsx` (restore, timers, activity tracking; `SessionsReady` gates anything that reads stored profiles or sessions).
- `proxmox/client.ts`: fetch wrapper (`{ data }` envelope, `PveError`), endpoint failover on network errors only, ticket creation and renewal, web dev-proxy routing via `EXPO_PUBLIC_PVE_DEV_PROXY`.
- `query/`: QueryClient, native focus/online wiring, keys scoped per login (`['pve', loginId, ...]`), hooks (`usePveQuery`, `usePveMutation`, `useSignIn`, ...).

## Static web rendering

`web.output` is `static`: `pnpm build:web` pre-renders every route to HTML in Node, then the browser hydrates it.

- Nothing touches storage during the pre-render: there is no `window`, the profiles store skips hydration, and sessions restore in an effect. Module-level code must not assume browser globals.
- The first render in the browser must match the HTML, so anything that reads stored profiles or sessions goes inside `SessionsReady` (its fallback is what the HTML holds). Don't gate a whole screen when only part of it needs the data.
- Theme-dependent styles stay in classNames (pure CSS, follows `prefers-color-scheme`). Values resolved in JS (`useUniwind`, `useResolveClassNames`) are the light theme during the pre-render.
- Dynamic routes are exported once as `dist/clusters/[clusterId].html`. `public/_redirects` rewrites `/clusters/<id>` to that file (200, URL unchanged), keeping `/clusters/new` ahead of the placeholder. Any other unknown path falls back to `index.html` (`not_found_handling: "single-page-application"`), which still works but re-renders on the client. Add a rule for each new dynamic route.
- Every page has one inline script, `globalThis.__EXPO_ROUTER_HYDRATE__=true;`; `public/_headers` allows exactly that script by its CSP hash. Recheck the hash if an Expo upgrade changes it.

## Security invariants

- Web never stores passwords or API token secrets anywhere, not even sessionStorage.
- Hostnames are stored only when the cluster is remembered; usernames only when the login is remembered and its cluster is too.
- A PVE ticket is stored at its session policy's persistence level, capped to `memory` when the cluster or login isn't remembered (or, on web, for token logins).
- PVE tickets live 2 hours; renew from 15 minutes. Client policy (idle, max age) may end a session sooner, never later.
- Send credentials as `Authorization: PVEAuthCookie=...` / `PVEAPIToken=...` headers with `CSRFPreventionToken` on writes, never cookies.

## Branches

`trunk` is the default branch; every PR targets it and is squash-merged. `live` is production: pushing to it deploys proxcommander.app (Cloudflare Workers Builds) and runs the EAS production builds. Only fast-forward `live` to `trunk` (`git push origin trunk:live`); never commit to `live` directly.

## Commits

Conventional Commits, always with a scope: `type(scope): summary`, lower-case imperative summary, no trailing period. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `style`, `revert`. The scope names the area touched, e.g. `feat(session): ...`, `fix(proxy): ...`, `chore(deps): ...`, `refactor(app): ...`. PR titles follow the same format, since they become the squash-merge commit on `trunk`. No AI attribution or co-author trailers.

## Other products

Never name competing apps, products or companies anywhere in this repo: code, comments, docs, commit messages, PR titles or bodies, issues, or release notes. Describe what other tools do in general terms ("a common pattern is ...", "some mobile clients ..."). Keep any named competitive research outside the repo. Proxmox's own products may be named where we integrate with them.

## Agent skills

Vendored in `.agents/skills/` and pinned in `skills-lock.json`: `expo-overview`, `expo-project-structure`, `expo-data-fetching`, `expo-design-system`, `expo-native-ui`, `expo-upgrade` (expo/skills), `react-native-best-practices` (callstackincubator/agent-skills), `uniwind` (uni-stack/uniwind). Restore or refresh with `pnpm dlx skills@1.7.6 experimental_install`.

Where a skill conflicts with this file, this file wins. In particular, the Expo skills route to `@expo/ui`, which this project doesn't use. They also say to submit feedback with `@expo/agent-cli`; don't send anything to Expo without the user's approval.
