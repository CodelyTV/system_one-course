# Slides: 01.1 What is a System One and how it works: Jev, Laya, Kev

## Rules

- Slide text is always in English
- Keep the bottom-right area as empty as possible: the presenters' video overlays it (roughly `x > 920px` and `y > 580px` on the 1920×1080 stage). Only tables may use it
- Content slides have no subtitles (only the cover has one)
- Content starts at the same left margin as the title emoji (`--margin-x`, 105px) unless told otherwise
- Slide transitions (Magic Move included) last 0.6s (`--transition-duration`) unless told otherwise
- Preferred build effects (Keynote settings):
  - Headings and standalone items: Fade and Scale, 0.3s, scale 95% → `data-anim="fade-scale"`
  - List items and sub-points: Fade and Move, 0.3s, left to right, travel distance 10% → `data-anim="fade-move"`
- Use the colors from the Codely design system (https://design-system.codely.com/). Take inspiration from its components too

## Context

- Single-file deck: `index.html` (1920×1080 stage scaled to the window)
- Visual design copied from the Codely Keynote template (`System One.key`): Moderat font, `#1b2232` background, emoji-led titles, cover with camo background and side pattern from `assets/`
- Builds: add `data-step="n"` (and optionally `data-anim="up|down|left|right|pop|wipe|draw"`) to reveal elements step by step
- Persistent states: `data-state-at="n"` adds `is-on` from step `n` without hiding the element (used to open the book on slide 2)
- Magic Move between consecutive slides: give matching elements the same `data-magic="name"` (unique per slide). Titles keep the emoji as `data-magic="title-emoji"`
- Magic Move by word (like Keynote): put `data-magic-text="name"` on text in consecutive slides. Shared words move to their new position, the rest fade. The cover title uses it to move into the slide 2 header
- Presenter view: press `P` to open a window with the current and next step
- Preview locally with `python3 -m http.server 8611 --directory 01-introduction/1-what_is_system_one/slides`
