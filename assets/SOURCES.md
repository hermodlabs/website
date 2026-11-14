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

## Announcing DecisionLab Marketplace

`blog/marketplace/` contains the assets for the announcement dated 14 November 2026.

- `cover.svg` is an original hand-authored native vector illustration: an open template leads to a configured app grouped in a collection, then to a person’s working case. It uses the site’s established palette and is reused on the homepage, blog card, and article header. It contains no external artwork or raster image.
- `figure-01.png` through `figure-04.png` are unedited 1440 × 1050 viewport captures of `https://hermodlabs.github.io/review_lab/` made in a fresh desktop Chrome browser context on 14 November 2026. They show Marketplace before installation, Published apps after installing Food supply chains, the independent case opened with Use app, and Marketplace’s Installed / View apps state. No interface labels, findings, or overlays were added to the captures.
- The case screenshot uses the application’s supplied synthetic FOOD-MINI-1 example. It is not a customer record or a real tracing investigation. Installation and case creation affected only the temporary browser profile.
- `capture-provenance.json` records the source URL, live catalog timestamp, selected collection/use case/app release, viewport, action sequence, captions, alternative text, and image hashes. `src/_data/marketplaceFigures.json` supplies the same images to the reader with intrinsic dimensions and full-size links.

The retired blog posts’ media and source-download bundles have been removed from the published asset tree.
