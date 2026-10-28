# ProSite Editor v0.3.0 — standalone Windows runtime prototype

This project builds a Windows installer containing Electron, a portable PHP runtime, WordPress core and the WordPress SQLite Database Integration plugin. **No Docker or separate WordPress installation for end users.**

## Build on GitHub

Upload **all contents** of this repository to `michelpupo5/prosite-editor-windows` keeping `.github`, `scripts`, and `src` folders intact. Run Actions → Windows installer → Run workflow. GitHub runner downloads PHP/WordPress/SQLite, packages them with Electron, and uploads an installer artifact. The ZIP is source code, **not an EXE**. The workflow installs PHP on the GitHub runner via Chocolatey, then bundles its binaries; end users do not install PHP.

## Preview workflow

Import a WordPress plugin ZIP → Start WordPress Preview. On first preview of a project, the app copies bundled WordPress core into the user's app-data directory, extracts the plugin, installs SQLite drop-in, runs WordPress setup/activation, starts PHP bound to `127.0.0.1` and shows the site. The Grace Events MIA plugin's activation hook creates pages, and the Home page is selected as the front page. Preview files remain under the app's user-data directory, and stopping the preview stops the PHP process.

## Limitations / security

- **Prototype; not tested on Windows**. Runtime compatibility and the SQLite plugin bootstrap need verification in a real Windows installer. The build workflow is not yet validated.
- **Do not import untrusted ZIPs.** Bundling PHP does NOT sandbox arbitrary plugin code: imported PHP executes with the Windows user's privileges. For distributing to the public, add an actual isolated execution boundary (restricted OS identity/VM or remote sandbox) before accepting third-party plugins.
- The visual canvas currently previews the live WordPress site. Wix-style drag/drop, DOM-to-PHP mapping and automatic WordPress-compatible export of edits are **not implemented**.
- Existing HTML editing/drafts and ZIP export remain. CSS exported for PHP plugins is not automatically enqueued. This needs an editing adapter.
- The local PHP development server is intended only for loopback preview, not public hosting.
- SQLite compatibility depends on the plugin and WordPress version; some plugins require MySQL or other services.

## Local development

`npm install`, `npm run check`, `npm start`. For a local preview without Docker, first run `scripts/prepare-runtime.ps1` on Windows (requires Chocolatey); GitHub Actions runs it automatically.
