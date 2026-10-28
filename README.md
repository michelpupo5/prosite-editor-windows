# ProSite Editor — Windows GitHub starter

A Windows Electron project for ProSite staff. It is **not** yet a full Wix-style builder or a WordPress runtime.

## Features implemented
- Import WordPress ZIP plugin (validated archive path, file count and size).
- Discover `add_shortcode()` registrations for reference.
- Project library with deletion confirmation.
- Preview and edit **standalone HTML** templates in a sandboxed frame.
- Desktop/tablet/phone preview widths.
- Save drafts and export a modified ZIP (HTML template updates).
- Include a separate CSS override file in exported ZIPs (not automatically enqueued).
- GitHub Actions builds Windows NSIS `.exe` installer on tag push or manual run.

## Limitations
- PHP shortcode output **cannot** be rendered without a real isolated WordPress runtime. No local PHP/WordPress engine is bundled in this version.
- Drag/drop and editing PHP-generated page structure are **not implemented**. Never claim the placeholder is a live website preview.
- Exported CSS overrides need a WordPress enqueue adapter to affect a PHP kit.
- Importing arbitrary plugins into a WordPress runtime must occur in an isolated disposable environment with network and filesystem restrictions.
- Unsigned Windows installer may trigger SmartScreen until code signed.

## Develop
Install Node.js 22+ and Git, then:

```powershell
npm install
npm start
```

## Build Windows installer
```powershell
npm run dist:win
```

Or push to GitHub and select **Actions → Windows installer → Run workflow**. Download the `.exe` from the workflow artifacts. A tag like `v0.1.0` also creates a GitHub Release.

## Business HQ download button
Install the companion Business HQ update ZIP. Under **Settings → ProSite Editor Download**, paste the **actual GitHub Releases installer URL** after your first successful build. The Business HQ dashboard then offers **Download ProSite Editor**. The URL is configurable; it is not guessed.

## Next milestones
1. Separate disposable WordPress preview runtime (Windows Docker/WSL2 or a managed isolated worker).
2. Kit dependency installation and shortcode page mapping.
3. DOM-based drag-and-drop with stable selectors and content adapters.
4. Export adapters that reliably update PHP kit templates and assets.
5. Staff sync with Business HQ and versioned client ZIP library.
