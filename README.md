# Li-ion Battery Backup Calculator

Sizes the battery bank for a hybrid solar plant from the loads that need to run during a grid outage. It's a static site with no build step. It installs as a Progressive Web App (PWA) and works offline once it has loaded.

## Project layout

```
public/                 # everything Vercel serves
  index.html
  styles.css
  app.js                # calculator logic + service worker registration
  sw.js                 # offline cache (bump VERSION after changing files)
  manifest.webmanifest
  icon.svg
  icons/                # PNG icons for Android / iOS install
vercel.json             # output dir, security + cache headers
package.json            # dev / deploy scripts (no dependencies)
```

## Run locally

```bash
npm run dev             # http://localhost:3000
```

## Deploy to Vercel

**CLI**

```bash
npm i -g vercel         # if not installed
vercel login
vercel                  # preview deployment
vercel --prod           # production deployment
```

**Git**

Push this folder to GitHub, GitLab or Bitbucket. Then go to vercel.com/new, import the repo and click **Deploy**. `vercel.json` already sets the output directory to `public`, so the defaults need no changes.

## Updating

After you edit any file in `public/`, change `VERSION` in `public/sw.js` (for example `"v1"` → `"v2"`). This makes installed copies throw away their old cache and load the new files.
