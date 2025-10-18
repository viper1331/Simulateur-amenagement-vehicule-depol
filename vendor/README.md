# Vendored dependency patches

The application relies on Electron tooling that still pulls in deprecated
packages such as `inflight`, `glob@7`, and `boolean`.  To keep our install
logs clean and avoid the deprecated modules we vendor a handful of packages
with small, documented changes:

- `@electron/asar`: dependency bump to `glob@^9.3.5` and `minimatch@^9.0.3` so
  that the tarball no longer depends on the deprecated `inflight` module.
- `@electron/get`: drops the optional `global-agent` dependency (the only
  source of `boolean@3.2.0`), skips the bootstrap call that required it and
  now wires proxy support through a lightweight `https-proxy-agent` helper so
  installs keep working behind corporate proxies.
- `https-proxy-agent` / `agent-base`: vendored copies so the proxy helper used
  by `@electron/get` is available offline and keeps its dependency tree under
  our control.
- `rimraf` (v2 and v3): both variants now depend on `glob@^9.3.5`, eliminating
  the final usage of `glob@7` in Electron's packaging toolchain.

The root `package.json` uses the `overrides` field to point to these vendored
packages so we can continue using upstream releases without waiting for their
transitive dependencies to be refreshed.
