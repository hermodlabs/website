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

## Article covers

`articles/covers/` contains twenty-three original hand-authored SVG illustrations, one for each evergreen article and guide. The filename follows the article’s URL slug; `src/_data/articles.json` records the image path, alternative text, and 960 × 720 intrinsic dimensions. Each native vector has its own accessible title and description, uses the site’s navy/teal/purple palette, and contains no external artwork or embedded raster image.

The compositions draw on each article’s subject: report handoffs, complete arrangements, shared resources, tradeoffs, commitments, changing availability, model structure, matching observations, agent sequencing, changing a selection, human oversight, decomposition, shared conventions, ontology, reasoning modules, reusable patterns, interpreting conditions, requirements, systems, feedback, capacity, and the report-plan guide. They are editorial illustrations rather than additional evidence or calculated findings. Article headers, library/category/topic cards, Platform sections, and ordered series entries reuse the same cover. Existing numbered source diagrams remain separate and unchanged.

## What Is a Question Worth?

The user supplied the essay **What Is a Question Worth?** by Jonathan Nacionales, Founder, Hermod Labs, dated 12 November 2026. The original is preserved at `blog/question-worth/what-is-a-question-worth.pdf`.

- `blog/question-worth/cover.svg` is an original hand-authored editorial illustration reused on the homepage, blog index card, and article header: a schematic balance compares two groups of marbles. It is separate from the essay’s numbered figures and does not represent a recorded weighing or calculated result.
- `blog/question-worth/figure-01.svg` through `figure-10.svg` are editable vector adaptations of the essay's first ten figures. They preserve its counts, labels, distinctions, mathematical data, and relationships while adapting colors and layout to the website. Rebuild them with `python3 scripts/generate-question-worth-figures.py`.
- `blog/question-worth/figure-11.png` through `figure-14.png` are the original app screenshots extracted from pages 14–17 of the supplied PDF. Only surrounding page furniture was cropped; the report findings were not changed. Their fictional premises and capture date remain in the post.
- `input-recipe.json` transcribes the article's setup; `verification-calculations.json` records independent arithmetic checks. These files are documentation, not app import files or physical observations.
- `source-files.zip` includes the original PDF, all fourteen figures, the input recipe, verification calculations, post source, dimensions, and generation/packaging scripts. Rebuild it after content or figure changes with `python3 scripts/package-question-worth-source.py`.

The post's equations use native MathML with spoken labels. They need no downloaded font, browser script, or math-rendering service.

## Choose Checks Before Releasing Gift Kits

The user supplied the nine-page **Choose Checks Before Releasing Gift Kits** PDF by Jonathan Nacionales, Founder, Hermod Labs, dated 12 November 2026. `blog/gift-kits/choose-checks-before-releasing-gift-kits.pdf` is an unchanged copy.

- `figure-01.svg` adapts the PDF’s complete customer-journey diagram, retaining its six nodes, labels, and directional relationships.
- `figure-02.svg` embeds the preceding article’s `question-worth/figure-02.svg` unchanged above the same concept families and relationships applied to Leah’s case. Rebuild both diagrams with `python3 scripts/generate-gift-kit-figures.py`.
- `cover.svg` is a separate original editorial illustration: a mug, open gift kit, printed insert, and magnifying glass. Its QR-like pattern is decorative, with no destination or implied test finding.
- `original-screenshots/figure-03.jpg` through `figure-07.jpg` are the exact embedded JPEG streams from PDF pages 4–8. The matching PNGs use the same visible clipping regions as the PDF; only surrounding interface furniture is excluded, and no findings are redrawn. `screenshot-extraction.json` records crop geometry and original/PNG/PDF hashes. Re-extract with `python3 scripts/extract-gift-kit-screenshots.py` on macOS (Swift ImageIO).
- `input-recipe.json` and `verification-calculations.json` document the source setup and check its timing and arithmetic. The source distinguishes modeled findings and simulated outcomes from the fictional physical resolution. USD 960 is potential handling exposure under a story assumption, not an observed saving or an app-calculated return.
- `source-files.zip` includes the original PDF, diagrams, cover, screenshot originals/crops, provenance, input recipe, calculations, post source, dimensions, original marble ontology, and supporting scripts. Rebuild it with `python3 scripts/package-gift-kit-source.py` after source changes. The scripts use the website checkout’s directory structure.
