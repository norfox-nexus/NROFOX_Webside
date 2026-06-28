# NORFOX — Private Preview (norfox.se/dev)

Backup / development copy of the NORFOX website with a simple password gate.

## How to change things on GitHub

Everything you normally touch lives in **one file: `site-config.js`**.

### Turn the password OFF or ON
Open `site-config.js` and change one line:

```js
passwordEnabled: true,   // locked  — visitors must type the code
passwordEnabled: false,  // open    — anyone can view the site
```

### Change the password
In the same file:

```js
password: "1635",   // change this to any code you like
```

Commit the change on GitHub. Nothing else needs editing.

> Note: the code is stored in the site files, so it keeps casual visitors
> out but is **not** strong security. Fine for a private preview.

## Hosting at norfox.se/dev
Put the contents of this folder into a `dev/` folder in your repo / web root.
The site will be live at `https://norfox.se/dev`.

## Moving it to the root (norfox.se) later
Just move all these files up one level into the web root. **No code changes
needed** — every path in the site is relative, so it works at `/dev` or at
the root automatically.

## Why it loads fast
The heavy parts (React + the app) only download **after** the password is
entered (or immediately, if the password is turned off). The lock screen
itself is tiny and appears instantly.

## Files
- `index.html` — lock screen + loader (rarely needs editing)
- `site-config.js` — **the file you edit** (password on/off + code)
- `norfox-app.jsx` — the website itself
- `tweaks-panel.jsx` — in-page design tweak panel
- `images/`, `apps/` — assets and sub-apps
- `robots.txt` — keeps search engines out
