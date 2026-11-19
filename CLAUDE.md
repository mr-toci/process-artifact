# process_artifact — project notes

Static scroll-story site (GitHub Pages) teaching the Process Artifact vs Utility Asset distinction to Y7–Y13 students and staff. No backend, no auth, nothing stored.

## The concept (keep copy consistent with this)
- **Process Artifact** — valued as *evidence that a process happened* (summit selfie, medal, belt, essay, personal feedback). AI-made = worthless. Do it yourself.
- **Utility Asset** — valued because it is *useful* (directions, a correct sum, a vocab quiz). Who/what made it doesn't matter; someone still checks it's right.
- **The test:** "If you found out AI made it, would it lose its value?" Yes → Process. No → Utility.
- **Purpose decides, not object type:** the same paragraph is Process (student essay) or Utility (teacher's model text).

## Files
- `index.html` — all chapters; content readable with JS/motion off.
- `css/style.css` — tokens on `:root`; pinned/motion layouts only under `html.motion`.
- `js/story.js` — GSAP 3.12.5 + ScrollTrigger (cdnjs, pinned) timelines.
- `js/classify.js` — classifier widget; any `<div class="classifier" data-round="…" data-count="…">`.
- `js/items.js` — item bank. Schema: `{id, round: 'r1'|'teacher'|'r2', emoji, title, context, answer: 'process'|'utility', why, pair?}`.

## Palette
Process = amber `#ffb238` / `#ff7a2f`. Utility = teal `#2ee6c9` / `#1fa3c4`. Night sky navy/indigo backgrounds.
Illustrations are original inline SVG in a flat-vector style; never use another studio's characters, name or branding.
