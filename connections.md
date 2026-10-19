# Connections

Registry of every system your AIOS can reach. Filled by `/onboard` from Q4-Q7 answers; expanded over time as you wire new tools. `/audit` checks this file for domain coverage and freshness.

| # | Domain | Tool | Mechanism | Auth | Last checked |
|---|---|---|---|---|---|
| 1 | Revenue / Financials | Not determined yet | not yet connected | — | — |
| 2 | Customer interactions | Gmail | mcp (claude.ai connector) | OAuth via claude.ai | 2026-10-01 |
| 3 | Calendar | Google Calendar | mcp (claude.ai connector) | OAuth via claude.ai | 2026-10-01 |
| 4 | Communication | Gmail | mcp (claude.ai connector) | OAuth via claude.ai | 2026-10-01 |
| 5 | Project / task tracking | Local project folders (this repo) | not yet connected | — | — |
| 6 | Meeting intelligence | Local project folders (this repo) | not yet connected | — | — |
| 7 | Knowledge / files | Google Drive + local project folders (this repo) | mcp (claude.ai connector) | OAuth via claude.ai | 2026-10-01 |

**Mechanism options:** `mcp` (MCP server), `script` (Python/Bash hitting an API, in `scripts/`), `export` (CSV/JSON dump pipeline), `key+ref` (`.env` key + `references/{tool}-api.md` guide), `not yet connected`.

When you wire a new tool, also save `references/{tool}-api.md` capturing endpoints, auth flow, and common queries — researched-once-saved-forever.

**2026-10-01:** Verified in a fresh session. Gmail (`search_threads`) and Google Calendar (`list_events`) both returned live data for mdb3624@gmail.com. Google Drive (`list_recent_files`) also verified, returned live files. Connectors expose write tools (send, reply, delete, create/update event), so confirm before any outbound action.
