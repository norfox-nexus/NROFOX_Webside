# Norfox — Temporary Website

A lightweight single-page "coming soon" site for **Norfox — Nordic Foundry Excellence**.
Animated aurora background, drifting Jupiter-style planet, rising embers, and a rotating
showcase of brand imagery (swaps every 5 seconds). No frameworks, no build step.

## Files

```
index.html      ← the whole site (HTML + CSS + JS inline)
favicon.png     ← browser tab icon
img/            ← optimized JPEG imagery (~700 KB total)
```

## Run locally

Just open `index.html` in any browser — no server needed.

## Deploy on GitHub Pages

1. Create a new repository and upload these files (keep the `img/` folder structure).
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick the `main` branch and the `/ (root)` folder, then **Save**.
5. Your site goes live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

## Customize

- **Rotation speed:** in `index.html`, change `5000` (milliseconds) in the slideshow script.
- **Add/remove images:** drop a JPEG into `img/`, then add an `<img>` tag inside `#frame`.
- **Colors:** the aurora blob colors live in the `.blob` CSS rules near the top.
