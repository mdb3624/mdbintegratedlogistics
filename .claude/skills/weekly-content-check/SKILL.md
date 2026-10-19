---
name: weekly-content-check
description: Use for the weekly content ritual, or when asked "what's next in the series", "any stale drafts", or "/weekly-content-check". Read-only. Reports the next unpublished slot per series, drafts older than 7 days, and the last decision-log entry.
---

# /weekly-content-check

Read-only weekly check on marketing content. Never drafts, publishes, or edits.

## Steps

1. Glob `projects/*-marketing/*/SERIES.md` (also `STRATEGY.md` or `README.md` where a series uses those for its plan).
2. For each series, read the pieces table. Report:
   - Last PUBLISHED piece and the next unpublished roadmap slot.
   - Every DRAFT, with file modified date. Flag any older than 7 days as stale.
3. Read the last entry in `decisions/log.md`. Report its date and title, and any **Open** items.
4. Check `git status` for uncommitted changes under `projects/*-marketing/`.

## Output

Lead with what needs action. Bullets only. No em dashes.
- **Act now:** stale drafts, open decision items, uncommitted marketing files.
- **Next up:** per series, the next slot and the command to run (`/content-pipeline` with the post number).
- **Quiet:** series with nothing pending, one line each.

End by asking whether to run `/content-pipeline` for the top next slot.
