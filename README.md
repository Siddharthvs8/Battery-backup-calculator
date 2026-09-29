# Li-ion Battery Backup Calculator

Sizes the battery bank, hybrid inverter and solar array for a hybrid solar plant from the loads that need to run during a grid outage. It's a static site with no build step. It installs as a Progressive Web App (PWA) and works offline once it has loaded.

The page runs top to bottom, with the three answers (battery bank, hybrid inverter, solar array) pinned at the top:

1. **Loads.** Add light, motor and power loads one by one from preset lists (watts, quantity, hours, power factor, Start ×), or switch to entering each group's totals. Includes an HP to watts helper.
2. **Battery bank.** Sized by whichever needs the most units: energy, continuous current or motor starting current.
3. **Hybrid inverter.** The larger of running kVA + 25% or peak starting kVA ÷ surge capacity, rounded up to a standard size.
4. **Solar array and recharge.** Covers the daytime load and refills the bank within the recharge target. Also shows MPPT current, PV input and recharge time.

Each section has its own Reset button.

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
scripts/build-offline.js  # builds battery-calculator-offline.html from public/
battery-calculator-offline.html  # single-file copy that opens from a phone's file manager
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

After you edit any file in `public/`:

1. Change `VERSION` in `public/sw.js` (for example `"v2"` → `"v3"`). This makes installed copies throw away their old cache and load the new files.
2. Run `npm run build:offline` to rebuild `battery-calculator-offline.html` so it matches.
