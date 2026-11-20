# ProxCommander

Expo app for iOS, Android, and web.

```sh
pnpm install
pnpm web         # browser
pnpm ios         # iOS simulator
pnpm android     # Android emulator
pnpm typecheck
```

## Web against a real Proxmox host

Proxmox VE sends no CORS headers, so in development the browser talks to it
through a local proxy (`scripts/pve-dev-proxy.mjs`, bound to 127.0.0.1 and
usable only from localhost origins):

```sh
pnpm proxy       # terminal 1
pnpm web:pve     # terminal 2: web app routed through the proxy
```

Hosts with self-signed certificates: `PVE_PROXY_INSECURE=1 pnpm proxy`.

## Hosting

The web build is served from [proxcommander.app](https://proxcommander.app) as
static files on Cloudflare Workers (static assets only: no Worker script, so
nothing runs between requests and requests stay on the free plan). Config is
in `wrangler.jsonc`; security headers are in `public/_headers`.

Cloudflare builds and deploys from GitHub (Workers Builds, free plan):

| Setting | Value |
|---|---|
| Repository | `ProxCommander/proxcommander` |
| Production branch | `live` |
| Build command | `pnpm build:web` |
| Deploy command | `pnpm exec wrangler deploy` |
| Preview builds | On (Settings > Build > Branch control) |
| Preview command | `pnpm exec wrangler preview` |

Node comes from `.node-version` and pnpm from `packageManager` in
`package.json`. The `proxcommander.app` zone must be on the same Cloudflare
account for the custom domain in `wrangler.jsonc`.

To deploy by hand instead: `pnpm deploy:web`.

The site reaches Proxmox through the optional
[gateway](https://github.com/ProxCommander/proxcommander-gateway), which adds
the CORS headers browsers need. pveproxy can't send them itself.

## Branches and releases

| Branch | What happens on push |
|---|---|
| `trunk` (default) | Cloudflare preview build of the web app |
| any PR or other branch | Cloudflare preview build, linked from the PR |
| `live` | Production: Cloudflare deploys proxcommander.app, and EAS builds iOS and Android (`.eas/workflows/production.yml`, profile `production` in `eas.json`) |

Work lands on `trunk` through squash-merged PRs. To release, fast-forward
`live` to `trunk`:

```sh
git push origin trunk:live
```

One-time EAS setup: `pnpm eas init` to link the Expo project, connect
this repo under the project's GitHub settings on expo.dev, and set up signing
with `pnpm eas credentials`.
