# How to Add a New Image

This guide explains how to add your own images to the rotating slideshow.
No coding experience needed — it's two simple steps.

---

## Step 1 — Put your image in the `img/` folder

Copy your image file into the **`img/`** folder (the same place as `logo.jpg`, `mug-black.jpg`, etc.).

Give it a simple, lowercase name with no spaces, for example:

```
img/new-mug.png
```

**Tip:** Avoid spaces and capital letters in the filename. On GitHub the name is
case-sensitive, so `Mug.png` and `mug.png` are treated as different files.

---

## Step 2 — Add one line to `index.html`

Open **`index.html`** in any text editor and find this block (it's near the middle):

```html
<div id="frame">
  <img class="active" src="img/logo.jpg" alt="Norfox — Nordic Foundry Excellence" />
  <img src="img/mug-black.jpg" alt="Norfox black mug" />
  <img src="img/mug-white.jpg" alt="Norfox white mug" />
  ...
  <img src="img/nordic-map.jpg" alt="Nordic region map" />
</div>
```

Add a new line **just before** the closing `</div>`:

```html
  <img src="img/new-mug.png" alt="New mug" />
```

Make sure the `src="..."` matches your filename from Step 1 exactly.

**Save the file — done!** The slideshow automatically includes the new image
in the rotation (one image every 5 seconds).

---

## Important rules

1. **Only the first image keeps `class="active"`.**
   That's the one shown when the page loads. Every new image you add is a plain
   `<img src="..." alt="..." />` with **no** `class`.

2. **The filename in `src` must match the real file exactly** (including `.png` or `.jpg`,
   and matching capitalization).

---

## PNG or JPEG?

Both work — the slideshow doesn't care about the format. You can mix them freely.

| Format | Best for | File size |
|--------|----------|-----------|
| **PNG** | Logos, line art, anything needing a **transparent background** | Larger |
| **JPEG** (.jpg) | Photos and colorful images | Much smaller |

Use **PNG** when you need transparency or crisp logos.
Use **JPEG** for photos to keep the page fast.

**Keep files light.** Phone photos are often 3–5 MB each, which slows the page down.
Before adding a big image, shrink it for free at **[squoosh.app](https://squoosh.app)**
(drag and drop, then download the smaller version).

---

## To change how fast images switch

In `index.html`, find this line in the script near the bottom:

```js
}, 5000);
```

The `5000` is the time in **milliseconds** (5000 = 5 seconds).
Change it to `3000` for faster, `8000` for slower, etc.

---

## To remove an image

Just delete its `<img ... />` line from the `#frame` block in `index.html`.
(You can also delete the file from the `img/` folder to keep things tidy.)
