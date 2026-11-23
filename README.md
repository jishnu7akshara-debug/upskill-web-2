# upskill web 2 — Aster School of Technology

Dark, editorial "school of technology" landing site. Static HTML/CSS/JS — no build step.

- **Palette:** Emerald night `#0B1D18` · Forest `#12302A` · Cream `#F2EADB` · Gold `#D4AF6A` · Sage `#9DB8A6`
- **Type:** Fraunces (serif display, italic accents) + Instrument Sans
- **Shapes:** arch-topped image frames, 32px rounded panels, pill buttons with fill-up hover
- **Loader:** cream screen, SVG ring that draws with a % counter and Learn / Build / Lead words; exits as a closing circle
- **Motion (GSAP + ScrollTrigger + Lenis):** blur-to-sharp masked headline lines, odometer digit counters, manifesto words that light up as you scroll, cursor-follow arched preview on the program list (tap to expand on mobile), film that opens from a pill mask to full frame, sticky stacked method cards that recede, infinite arched campus reel, timeline line that draws itself, floating-label form
- Works without the CDN (content stays visible; loader exits via CSS)

## Replace before launch
Brand name, phone, email, address, fees, dates, outcome figures and faculty names are placeholders. Wire `form()` in `js/main.js` (marked TODO) to your CRM. Swap in the client's own photos/video.

## Deploy
Vercel ("Other", no build) or Netlify drag-and-drop — `vercel.json` / `netlify.toml` included.
