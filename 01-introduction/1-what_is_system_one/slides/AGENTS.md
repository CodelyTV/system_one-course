# Slides: 01.1 What is a System One and how it works: Jev, Laya, Kev

## Rules

- Slide text is always in English
- Keep the bottom-right area as empty as possible: the presenters' video overlays it (roughly `x > 920px` and `y > 580px` on the 1920×1080 stage). Only tables may use it
- Content slides have no subtitles (only the cover has one)
- Content starts at the same left margin as the title emoji (`--margin-x`, 105px) unless told otherwise
- Slide transitions (Magic Move included) last 0.6s (`--transition-duration`) unless told otherwise
- Preferred build effects (Keynote settings):
  - Headings and standalone items: Fade and Scale, 0.3s, scale 95% → `data-anim="fade-scale"`
  - List items and sub-points: Fade and Move, 0.3s, left to right, travel distance 10% → `data-anim="fade-move"`. Top to bottom (40px) → `data-anim="fade-move-down"`, bottom to top → `data-anim="fade-move-up"`
- Code uses Dank Mono Nerd Font (`--mono`)
- Use the colors from the Codely design system (https://design-system.codely.com/). Take inspiration from its components too

## Context

- Single-file deck: `index.html` (1920×1080 stage scaled to the window)
- Visual design copied from the Codely Keynote template (`System One.key`): Moderat font, `#1b2232` background, emoji-led titles, cover with camo background and side pattern from `assets/`
- Builds: add `data-step="n"` (and optionally `data-anim="up|down|left|right|pop|wipe|draw"`) to reveal elements step by step
- Build out: `data-out="n"` hides a built element from step `n` with the reverse of its `data-anim` effect
- Sparkle (Keynote, left to right): wrap two stacked texts in `<span class="sparkle-swap" data-sparkle-at="n"><span class="sparkle-out">Old</span><span class="sparkle-in">New</span></span>`. At step `n` a glowing particle head sweeps the text, hides the old one and reveals the new one (canvas, 0.3s)
- Code focus: put `data-code` on the code block, wrap each line in `<span class="ln">` and add `data-focus="n"` (space-separated steps) to the lines to keep colored at step `n`. The other lines dim to gray
- Anvil (Keynote): `data-anim="anvil"` drops the element from above with a squash and a canvas smoke cloud on impact
- Callout: `<div class="callout" data-step="n"><p data-step="n" data-anim="fade-scale">Text</p></div>` blurs and darkens the whole slide and shows a big centered sentence
- Persistent states: `data-state-at="n"` adds `is-on` from step `n` without hiding the element (used to open the book on slide 2). Add `data-state-until="n"` to remove `is-on` again from step `n`
- Magic Move between consecutive slides: give matching elements the same `data-magic="name"` (unique per slide). Titles keep the emoji as `data-magic="title-emoji"`
- Magic Move by word (like Keynote): put `data-magic-text="name"` on text in consecutive slides. Shared words move to their new position, the rest fade. The cover title uses it to move into the slide 2 header. Add `data-magic-swap` to make the words that do not match leave downwards and enter from above (Fade and Move, 0.3s each) instead of a fade
- Presenter view: press `P` to open a window with the current and next step
- Preview locally with `python3 -m http.server 8611 --directory 01-introduction/1-what_is_system_one/slides`
