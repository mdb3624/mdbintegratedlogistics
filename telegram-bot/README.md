# AIOS Telegram Bot

Lets you message this AIOS from Telegram and get replies from Claude Code
running in this repo. One bot serves several people; each person is scoped
to their own folder and tool set. See the design spec at
`docs/superpowers/specs/2026-09-30-telegram-bot-design.md` for the full
design and its intentional v1 limitations (single-turn only, one machine,
no auto-restart).

## Setup

1. **Create the bot**: message [@BotFather](https://t.me/BotFather) on
   Telegram, run `/newbot`, and follow the prompts. It gives you a token
   that looks like `123456789:AAExampleTokenTextHere`.
2. **Find your Telegram user ID**: message
   [@userinfobot](https://t.me/userinfobot) — it replies with your numeric
   ID.
3. **Configure**: copy `.env.example` to `.env` and set
   `TELEGRAM_BOT_TOKEN`. Then copy `users.example.json` to `users.json` and
   edit it. Each key is a numeric Telegram user ID. Each entry needs:
   - `cwd`: folder Claude runs in, relative to the repo root. Must be inside
     the repo.
   - `allowedTools`: required, non-empty. Only these tools run.
   - `disallowedTools`: optional deny list.

   To scope Danny to the EAM project only, give him
   `"cwd": "projects/eam"`, `allowedTools` of `Read(./**)` and `Edit(./**)`,
   no `Bash`, and his own numeric ID as the key.
   Restart the bot after editing `users.json`.
4. **Install and run**:
   ```
   npm install
   npm start
   ```
5. Message your bot on Telegram. Leave the `npm start` terminal open —
   the bot only responds while that process is running.

## Scoping limits (read before adding Danny)

- A working directory is not a sandbox. The tool allowlist is the boundary.
  Never put `Bash` in a collaborator's `allowedTools`: a shell can read
  anywhere on this machine.
- In headless mode Claude cannot prompt for permission, so any tool not in
  `allowedTools` is denied.
- A bare `Read` or `Edit` is **not** limited to the working directory. It
  can read any path on the machine (verified). Scope with a path rule such
  as `Read(./**)` and `Edit(./**)`, which was verified to deny reads outside
  the folder. `Edit(./**)` also covers `Write`.
- `Glob` and `Grep` cannot be path-scoped and can search outside the working
  directory (verified). Leave them off a collaborator's list.
- Claude Code loads parent `CLAUDE.md` files, so Danny's runs will read this
  repo's root `CLAUDE.md` and your global one. Keep secrets out of both.
- Danny's runs use `projects/eam` project memory, separate from yours.

## Manual verification checklist

- [ ] Message the bot from your allowlisted account, ask it something
      about this repo (e.g. "what files are in the context folder?") —
      confirm the reply reflects this repo's actual content.
- [ ] Send a skill-style message (e.g. `/audit`) — confirm it behaves the
      same as running it in an interactive Claude Code session.
- [ ] Message the bot from a second Telegram account that is not in
      `users.json` — confirm you get no reply at all.
- [ ] Message from Danny's account: ask it to list files in `projects/eam`
      (works), then ask it to read `context/about-business.md` and run a
      shell command (both must be refused).
- [ ] Ask a question that produces a long reply — confirm it arrives as
      multiple Telegram messages, none truncated or malformed.
- [ ] Send a non-text message (a sticker or photo) from your allowlisted
      account — confirm the bot does not crash and simply ignores it.
