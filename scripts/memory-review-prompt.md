You are doing a read-only monthly staleness review of Claude Code memory files. Do not edit, create, or delete anything.

Memory folder: C:\Users\Owner\.claude\projects\c--projects-mdbintegratedlogistics\memory\
Repo: C:\projects\mdbintegratedlogistics

Steps:
1. Read MEMORY.md and every memory file it lists. Also list any memory file not in the index, and any index line with no file.
2. For each memory, check any file, path, folder, convention, or fact it names against the repo (and against CLAUDE.md in the repo root). Verify, do not assume.
3. Flag: stale or wrong claims, conflicts with CLAUDE.md, duplicates of CLAUDE.md content, memories that are derivable from the repo and so should not be memories, and index lines that do not match their file.

Output a markdown report only:
- Date at the top.
- A table: memory name | status (OK / stale / conflict / duplicate / orphan) | what is wrong | suggested fix.
- A short "Needs your decision" list, most important first.
Be terse. No em dashes.
