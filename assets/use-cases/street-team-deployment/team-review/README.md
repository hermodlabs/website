# Distinct evidence for the team-review article

These screenshots show responsibility and decision validity in the working promotion workflow. They deliberately focus on different questions from the first article’s operating and financial comparisons.

The retained Marketplace installation identifies **Review a street-team deployment 1.1.0**, package `966b0d13926da6ac0e600599d618b8f06c9b18524aa7db33456d076f570e8583`, definition `246fb8e7d7d7ea9099d53bd4d4b7977044989776f2d15cfd03f7a652712aa407`. The installable workbook envelope, original worked run and changed run are copied from the preceding Marketplace verification and hashed here. Older evidence remains unchanged.

## Keep the stages distinct

**Fresh starter:** opening the exact installation link in an empty temporary profile creates a new private review. Every supplied input awaits review; proposal and authorization are unanswered. There are no evaluations or accepted reviews. `starter-next-review.png` identifies **Next review step**, **Responsible role: Floor lead**, and **Review answer: Qualified staffing and evening scope**. Following that button opens the input stage. `starter-review-responsibility.png` shows an empty **Reviewer name** field and **Acting role: Floor lead**. Neither action accepts anything.

**Sam’s worked night:** the other screenshots import the separately supplied native worked cases. `current-choice.png` shows the authored **What has Sam chosen and specifically authorized?** section after two callouts: current-choice and matching-authorization findings are Yes, the one-person standard push is recorded, its expense is $200, and four qualified people remain inside.

`changed-choice.png` captures exactly the same authored section and viewport after the retained third-callout reassessment. Both current-basis findings are No, and the current choice and associated expense are unavailable. The earlier proposal and authorization remain in the native case and its history. No replacement choice is recorded; the tool does not revoke external permission or carry out an assignment.

The changed brief’s proposed action is **Sam chooses among the passing deployments**, owned by **Venue manager**, with only `hold` available. `changed-proposed-action.png` shows that outstanding action. At this retained stage, the complete output has no `nextActions` continuation button. The article should not promise one.

## Source stages and frames

| Stage | Retained source | Native run hash | Frame |
| --- | --- | --- | --- |
| Fresh unreviewed starter | Created through the exact install link; `retained/starter-before-inspection.run.json` | `49df8d1ad505ff1a0084fe5efe099c617af109a262e283ec48a749c3b13a5185` | Next review step: 581 × 192; responsibility controls: 629 × 181 |
| Sam’s reviewed two-callout night | `../marketplace/article.run.json`, copied as `retained/article.run.json` | `892bbc75f5ba6c1229907a0c20cd97aabb2f759b73ff3ef23c2a115a1c6fa00e` | Current choice: 551 × 341 |
| Same night after third-callout reassessment | `../marketplace/retained/third-callout-reassessed.run.json`, copied here under the same filename | `708c9b7842e369df6ba414be43b76071f1dccb3b24bd5858707aef0e9182216f` | Changed choice: 551 × 399; outstanding proposed action: 551 × 271 |

The starter is revision 0. Sam’s retained worked stages are revisions 13 and 17 of the same native case. They are separate from the fresh starter and must not be presented as its completed review. File hashes, displayed facts and exact workflow definitions are in `verification.json`.

## Capture and integrity

Every image is an unaltered native element screenshot. No pixels, DOM, CSS, business findings or application state are fabricated or injected. Ordinary viewport sizing makes the decision section stack naturally into one column. Both decision captures use an 820-pixel-wide browser, the same authored region and the same region width. The fresh-starter responsibility views use an 850-pixel browser.

`verification.json` records dimensions, hashes, exact source runs and before/after exports. The complete native run exported after each inspection equals its pre-inspection source. Opening the supporting decision disclosure, moving between stages and reloading changes no answers, accepted findings, reviewers, proposal, authorization or history.

The two worked stages share a native run identifier. Each is therefore imported in a separate temporary browser profile, preserving the other stage rather than replacing local work.

Reproduce with Node 24 and the matching installed packages and existing production build in the supplied Decision Lab repository:

```sh
node scripts/capture-street-team-review.mjs /absolute/path/to/hermod-review-lab
```

The script reads that repository, serves its existing `dist/` directory and writes only this website’s dedicated evidence folder. It closes its temporary browser contexts and server on completion. No build or source changes are made to Decision Lab.
