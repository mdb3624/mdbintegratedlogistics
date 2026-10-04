---
name: content-pipeline
description: Use when drafting the next LinkedIn post, article, or teaser in an existing series. Runs drafter, fact-checker, and framing-checker sub-agents in a loop (max 3 passes) and returns a verified draft with a claim-to-source table. Trigger on "/content-pipeline", "draft the next post in the series", "write post N".
---

# /content-pipeline

Drafts one piece of series content, verifies every claim against the repo, checks it against the series intent, and loops until both checks pass. Never publishes. Output is a DRAFT for Mike's review.

## Inputs

Ask only for what is missing:
- **topic**: what this piece covers
- **series**: series folder name, e.g. `vibe-coding-series`
- **format**: `post` (short feed post), `article` (LinkedIn long-form), or `teaser`

## Paths (repo convention, from CLAUDE.md)

- Marketing lives in `projects/<project>-marketing/<series>/`, never inside the project's code repo, never at the repo root. Example: `projects/freightclub-marketing/vibe-coding-series/`.
- Registry: `projects/<project>-marketing/<series>/SERIES.md`.
- Voice: `references/voice.md`. Short sentences, no em dashes, bullets over paragraphs.
- Code repos are nested git repos. Verify claims with `git -C projects/<project> log ...`, not the root repo.
- The nested copy can be STALE. Before fact-checking, find every clone of the project (`C:\projects\<project>`, the nested copy, any other), compare `git log -1` date and current branch, and verify against the most recent working clone. Tell every checker which clone to use. Local-state claims (hooks, uncommitted config) are per clone; GitHub-side claims (branch protection, CI runs) are checked with `gh api`.

## Step 1: Load or create the registry

Read `SERIES.md`. If missing, build it by scanning every `.md` in the series folder:
- Series intent: the angle and audience (read from the earliest teaser/post and from memory `linkedin-series-angle`).
- One row per piece: file, format, title, one-line summary, claims/incidents/bullets it already used, status.
- Mark status `DRAFT` for everything, then ask Mike ONE question: which pieces are already published (and their URLs if any). Update statuses from the answer. Do not guess published status.
- Record the planned roadmap if the teaser or posts state one.

## Step 2: Draft (sub-agent 1)

Spawn a drafter. Give it: topic, format, series intent, the full registry, `references/voice.md`, and the files of every prior piece. It writes `<series>/<next-file-name>.md` with:
- `STATUS: DRAFT for Mike's review. Not published.`
- Format note and publishing note (feed posts: no link in body, article link goes in the first comment; articles: no hashtags unless Mike asks).
- The piece, then a "Notes for Mike (not for publishing)" section listing every factual claim and what to confirm.

Rules for the drafter:
- Must add new material. Do not restate any bullet, incident, or line from a prior post or teaser.
- Only use facts it can source from the repo. Do not invent numbers, dates, PRs, or test counts.
- Open with the vibe-coding failure mode or contrast, then the agile mechanism that prevents it (when the series intent says so).

## Step 3: Check (two sub-agents in parallel, never more than 3 agents at once)

**Fact-checker.** Extract every number, date, PR, test count, incident, and "X caused Y" claim. Verify each against git log (`git -C`), the repo docs, role docs, RACI, and story files. Output a table: claim | source (file:line or commit) | verdict (VERIFIED / WRONG / UNSOURCED). Flag any attribution that mixes up which feature or story did what. Read-only.

**Framing-checker.** Compare the draft to the series intent and the registry. Reject if: the angle drifts, it repeats any prior piece or teaser content, it treats a draft as published (or the reverse), it breaks voice rules (em dashes, long paragraphs), or it promises content the series does not deliver. Output PASS or REJECT with line-level reasons. Read-only.

## Step 4: Loop

If either check fails, send the findings back to a drafter sub-agent (new agent, with the failing table and reasons) to revise the file, then re-run both checks. Maximum 3 iterations. If still failing after 3, stop and report the open flags. Do not loosen the checks to force a pass.

## Step 5: Output

Show Mike:
1. The final draft (inline, in full).
2. The claim-to-source table from the last fact-check.
3. Unresolved flags (UNSOURCED claims, anything needing Mike's confirmation, iteration count).
4. File path of the saved draft.

Update `SERIES.md` with the new piece as `DRAFT`. Start the handoff with one line naming the audience.

## Hard rules

- Never publish or post anything. Mike approves every external piece.
- Do not edit prior pieces. Report problems found in them instead.
- Cap parallel sub-agents at 3. Verify each file was written before moving on.
- No em dashes in anything written for Mike's voice.
