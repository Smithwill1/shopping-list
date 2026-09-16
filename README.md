# Shopping List

A tiny installable shopping list PWA — no app store, just a URL.

## Run it locally

Open `index.html` with any static file server, e.g.:

```
npx serve .
```

Then open the printed URL on your phone (same Wi-Fi) or deploy it (see below) and visit it in Safari/Chrome, then "Add to Home Screen."

## Deploy for free

Any static host works — GitHub Pages, Netlify, Vercel, Cloudflare Pages. GitHub Pages is easiest since the code already lives on GitHub:

1. Push this repo to GitHub.
2. In the repo settings, enable **Pages** → deploy from the `main` branch, root folder.
3. Visit the given `github.io` URL on your phones and "Add to Home Screen."

## Current status

- ✅ Add / check off / remove items
- ✅ Installable on iPhone home screen
- ✅ Works offline (service worker caches the app shell)
- ⏳ **Not yet shared between devices** — each phone has its own local list (stored in `localStorage`). Next step: wire up a small shared backend (e.g. Firebase Firestore free tier) so you and your wife see the same list update live.
