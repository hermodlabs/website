# Reused assets

Downloaded 2026-09-23 for the Hermod Labs corporate rebuild:

- `hermod-wordmark.jpeg`: https://hermodlabs.com/assets/hermod-wordmark.jpeg
- `hermod-symbol.jpeg`: https://hermodlabs.com/assets/hermod-symbol.jpeg
- `hermod-gg-composition.png`: https://hermod.gg/assets/product/ashe-composition.png
- `hermod-gg-contribution.png`: https://hermod.gg/assets/product/ashe-contribution.png

`site.css` adapts the typography, colors, logo treatment, section spacing, and rules from https://hermodlabs.com/style.css. Product captures are actual Hermod.gg screenshots. Champion imagery within those captures belongs to Riot Games.

`hermod-wordmark-dark.png` is an existing repository asset retained for the standalone legacy League prototype pages.

`decision-lab-report-plan.png` is an actual 663 × 685 capture of the Free beta timing report, taken on 2026-11-10 from the `review_lab` static application using the exact model in `src/_data/homeExample.json`. The required-work section is expanded to show that reviewer independence remains unconfirmed. The screenshot contains fictional example names and no customer records.

`examples/report-plan.hermod` contains that same description and final query as plain text. The practical guide and Decision Lab product example use the same source; moving only its deadline from day three to day two yields no feasible arrangement under the declared timing and availability.

## What Is a Question Worth?

The user supplied the essay **What Is a Question Worth?** by Jonathan Nacionales, Founder, Hermod Labs, dated 12 November 2026. The original is preserved at `blog/question-worth/what-is-a-question-worth.pdf`.

- `blog/question-worth/figure-01.svg` through `figure-10.svg` are editable vector adaptations of the essay's first ten figures. They preserve its counts, labels, distinctions, mathematical data, and relationships while adapting colors and layout to the website. Rebuild them with `python3 scripts/generate-question-worth-figures.py`.
- `blog/question-worth/figure-11.png` through `figure-14.png` are the original app screenshots extracted from pages 14–17 of the supplied PDF. Only surrounding page furniture was cropped; the report findings were not changed. Their fictional premises and capture date remain in the post.
- `input-recipe.json` transcribes the article's setup; `verification-calculations.json` records independent arithmetic checks. These files are documentation, not app import files or physical observations.
- `source-files.zip` includes the original PDF, all fourteen figures, the input recipe, verification calculations, post source, dimensions, and generation/packaging scripts. Rebuild it after content or figure changes with `python3 scripts/package-question-worth-source.py`.

The post's equations use native MathML with spoken labels. They need no downloaded font, browser script, or math-rendering service.
