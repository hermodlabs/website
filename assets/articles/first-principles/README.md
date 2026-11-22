# First Principles source preservation

The three essays originally appeared in the Blog on November 18, 2026. They now belong to the First Principles article collection. Their original publication dates, authors, SVG covers, illustrations, MathML, tables, citations, and prose are retained, with the exact audited editorial corrections described below.

`migration-manifest.json` records an exact UTF-8 snapshot of each original source, its body hash, MathML and figure fragment hashes, and the permitted body transformations. Apply the three declared internal-route substitutions in order, then any article-specific `editorialCorrections`, to reproduce the current body exactly.

Article 25's product description no longer claims that current calculation workflows retain acceptance of an analytical finding. The replacement distinguishes supplied inputs, calculated findings, an operating choice, and sourced external authority. All three essays identify the decision-statement slot names as explanatory notation and distinguish them from SDK schemas and workflow definitions. Article 27 describes current scoped diagnostic evidence without implying an analytical acceptance step. The conceptual discussion of a responsible person's agreement to an operating commitment remains intact.

The manifest records every exact original and replacement passage and its reason. The checker maintains an independent allowlist and requires each correction exactly once; it does not allow arbitrary prose changes. The original source snapshots and their original hashes remain unchanged. Only the current body hashes reflect the declared corrections; mathematical examples, figures, citations and publication dates are unchanged.

The source snapshots are text files under `source/`; they are retained for source-fidelity inspection rather than published as duplicate essays. Old routes are non-indexed redirects to the new canonical pages and preserve section fragments.

Run `node scripts/check-first-principles.mjs` after the site build to check source fidelity, rendered mathematics, citations, publication metadata, related reading, continuation order, and redirects.
