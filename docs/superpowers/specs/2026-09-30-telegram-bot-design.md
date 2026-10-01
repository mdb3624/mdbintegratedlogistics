# Telegram Bot Integration — Design Spec

**Date:** 2026-09-30
**Status:** Approved for implementation

## Purpose

Let Mike interact with this AIOS (and, later, invited collaborators starting with
Danny Chris) from Telegram instead of only from a terminal session. Messages sent
to a private Telegram bot are relayed to Claude Code running in this repo, so
replies have the same context (CLAUDE.md, skills, memory) as an interactive
session would.

## Scope (v1)

- One bot, multiple users, each scoped per user. Mike gets the repo root.
  Danny gets `projects/eam` only, with a restricted tool set (no `Bash`).
  Adding or changing a user is a `users.json` edit, not a code change.
- Both open-ended chat and slash-command-style messages (e.g. `/audit`,
  `/level-up`) are supported — both are just forwarded as the prompt text.
- Runs locally on Mike's machine only. No public webhook, no cloud hosting.
- Each message is a **stateless, one-shot** call to Claude — no multi-turn
  conversation continuity between messages in v1.

Explicitly out of scope for v1 (deferred until actually needed):
- Multi-turn session continuity / resuming a specific prior conversation.
- Multiple concurrent allowlisted users interacting at the same time.
- Always-on hosting (VPS, systemd/Task Scheduler service, auto-restart).
- Rich Telegram features (inline keyboards, buttons, file uploads).

## Architecture

```
Telegram user
     │  message
     ▼
Telegram Bot API (long-polling, no public URL needed)
     │
     ▼
telegram-bot/bot.js  (Node.js process, run locally via `npm start`)
     │  1. look up sender's numeric Telegram user ID in users.json
     │  2. if unknown → ignore silently, no reply
     │  3. if known → spawn child process:
     │       claude --allowedTools ... --disallowedTools ... -p "<message text>"
     │       (cwd and tool lists come from that user's entry)
     │  4. capture stdout, chunk to ≤4096 chars, send back via Telegram
     ▼
Claude Code headless CLI, running in this repo's directory
     (picks up CLAUDE.md, skills, and project memory for its cwd, like an
      interactive session started in that folder)
```

### Components

- **`telegram-bot/bot.js`** — the bot process. Single file for v1; split out
  only if it grows unwieldy.
  - Uses `node-telegram-bot-api` in polling mode.
  - On each message: user lookup → spawn `claude -p` with that user's cwd
    and tool flags → reply.
  - Chunks any reply longer than Telegram's 4096-character limit into
    multiple messages.
- **`telegram-bot/.env`** (gitignored) — holds:
  - `TELEGRAM_BOT_TOKEN` — from BotFather.
  - `USERS_FILE` — optional path to the users file (default `users.json`).
- **`telegram-bot/users.json`** (gitignored) — map of numeric Telegram user
  ID → `{ name, cwd, allowedTools, disallowedTools? }`. `cwd` must resolve
  inside the repo root; `allowedTools` is required and non-empty, so there
  is no unrestricted default. Invalid entries fail startup.
- **`telegram-bot/users.example.json`** — committed template with Mike and
  Danny entries.
- **`telegram-bot/package.json`** — `node-telegram-bot-api`, `dotenv` as
  dependencies; `npm start` runs the bot.
- **`telegram-bot/.env.example`** — committed template showing the
  required variable, so setup is documented without leaking Mike's real
  token.

### Data flow / state

None persisted. Each incoming message maps 1:1 to one `claude -p` invocation
and one reply. No database, no session store.

## Error handling

- Claude CLI invocation fails or times out → bot replies with a short error
  message to the user rather than hanging silently.
- Message from a user ID not in `users.json` → silently ignored (avoids leaking
  that the bot exists / responds to probing).
- Bot process crash → no auto-restart in v1; Mike restarts it manually
  (`npm start`). Acceptable since it's a personal, local-only tool right now.

## Security

- Bot token lives only in `telegram-bot/.env`, which is gitignored.
- Access is enforced by numeric Telegram user ID (not username, which can
  change) before any message reaches Claude.
- The tool allowlist, not the working directory, is the security boundary.
  A cwd alone does not sandbox Claude. Collaborators never get `Bash`.
  In headless mode unlisted tools are denied. Bare `Read`/`Edit` reach any
  path, so scoped users get path rules (`Read(./**)`, `Edit(./**)`).
  `Glob`/`Grep` can't be path-scoped and leak outside the cwd, so they are
  left off scoped users' lists. Both behaviors were verified against the
  real CLI.
- Known leak: Claude Code loads parent `CLAUDE.md` files, so a scoped user's
  runs can see the repo root and global `CLAUDE.md` contents. Keep secrets
  out of them.
- No secrets or tokens are ever echoed back into Telegram replies.

## Testing

- Manual verification (this is a personal integration tool, not a
  customer-facing service — no automated test suite planned for v1):
  1. Message the bot from Mike's Telegram account → confirm a reply comes
     back reflecting this repo's context (e.g. ask it to name a file in
     `context/`).
  2. Send a recognized skill-style message (e.g. `/audit`) → confirm it
     behaves the same as running it in an interactive Claude Code session.
  3. Message from a second Telegram account not in `users.json` → confirm
     the bot sends no reply at all.
  3b. Message from Danny's account → listing `projects/eam` works; reading
     `context/about-business.md` and running a shell command are refused.
  4. Send a message that would produce a long reply → confirm it arrives as
     multiple chunked Telegram messages, none truncated or malformed.

## Future work (not v1)

- Add Danny's Telegram user ID to `users.json` once he's ready to use it.
- Multi-turn conversation continuity, scoped per Telegram user once more
  than one person is actively using the bot (needs a design decision on
  session-ID mapping per user/chat).
- Always-on hosting if reliance on the bot grows beyond "nice to have when
  my machine happens to be on."
