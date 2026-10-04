# Memory Staleness Review — 2026-10-01

## Index check
MEMORY.md lists 4 entries; all 4 files exist in the memory folder. No files in the folder are missing from the index, and no index line points to a missing file.

| Memory | Status | What's wrong | Suggested fix |
|---|---|---|---|
| linkedin-series-angle.md | OK | Links to `[[voice-linkedin-drafts]]`, which doesn't exist as a memory file (voice guidance actually lives at `references/voice.md` in-repo). Not wrong, just an unresolved pointer. | Either write a short `voice-linkedin-drafts` memory pointing at `references/voice.md`, or drop the `[[...]]` link and cite the file path directly. |
| feedback_series-content-overlap.md | OK | None found. Links to `[[linkedin-series-angle]]`, which exists and matches current repo state (vibe-coding-series posts confirmed in `projects/freightclub-marketing/vibe-coding-series/`). | None. |
| project_docs-marketing-convention.md | duplicate (partial) | Opening paragraph ("Standing convention... codified in this repo's CLAUDE.md") restates CLAUDE.md's "Where things live" section almost verbatim — the memory itself flags this. The specific paths it cites (`vibe-coding-series/`, `token-savings-governance-series/`, FreightClub repo's `docs/governance/linkedin-series/`) were all verified present and correct. | Trim the restated convention paragraph; keep only the project-specific history (why it evolved, the failed `projects/freightclub/docs/marketing/` attempt, the explicit-confirmation caveat about deleting the canonical copy) since that part isn't derivable from the repo. |
| feedback_private-notes-not-shared-events.md | OK | None found. Path it prescribes (`projects/<name>-marketing/interviews/`) is in use — `projects/freightclub-marketing/interviews/2026-10-07-salma-call-prep.md` exists. | None. |

## Needs your decision
1. **project_docs-marketing-convention.md duplicates CLAUDE.md** — trim it to the non-derivable history only, or leave as-is since it's cheap. Lowest-risk cleanup, but it's the clearest case of memory that should shrink.
2. **Dead link `[[voice-linkedin-drafts]]`** in linkedin-series-angle.md — decide whether a dedicated voice-for-LinkedIn memory is worth creating or the link should just be removed.
3. No content is factually stale or conflicting with CLAUDE.md right now — all memories are ≤4 days old and every path/claim checked out against the live repo.
