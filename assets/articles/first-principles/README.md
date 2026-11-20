# First Principles source preservation

The three essays originally appeared in the Blog on November 18, 2026. They now belong to the First Principles article collection. Their original publication dates, authors, SVG covers, illustrations, MathML, tables, citations, and full prose are retained.

`migration-manifest.json` records an exact UTF-8 snapshot of each original source, its body hash, MathML and figure fragment hashes, and the only permitted body transformations: replacing internal links to the three old blog routes with their new article routes. Apply those substitutions, in the recorded order, to the retained original body to reproduce the migrated body exactly.

The source snapshots are text files under `source/`; they are retained for source-fidelity inspection rather than published as duplicate essays. Old routes are non-indexed redirects to the new canonical pages and preserve section fragments.

Run `node scripts/check-first-principles.mjs` after the site build to check source fidelity, rendered mathematics, citations, publication metadata, related reading, continuation order, and redirects.
