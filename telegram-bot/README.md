# AIOS Telegram Bot

Lets you message this AIOS from Telegram and get replies from Claude Code
running in this repo. See the design spec at
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
3. **Configure**: copy `.env.example` to `.env` and fill in:
   ```
   TELEGRAM_BOT_TOKEN=<token from BotFather>
   ALLOWED_USER_IDS=<your numeric id>
   ```
   To add another person later (e.g. Danny), append their ID:
   `ALLOWED_USER_IDS=111111111,222222222`.
4. **Install and run**:
   ```
   npm install
   npm start
   ```
5. Message your bot on Telegram. Leave the `npm start` terminal open —
   the bot only responds while that process is running.

## Manual verification checklist

- [ ] Message the bot from your allowlisted account, ask it something
      about this repo (e.g. "what files are in the context folder?") —
      confirm the reply reflects this repo's actual content.
- [ ] Send a skill-style message (e.g. `/audit`) — confirm it behaves the
      same as running it in an interactive Claude Code session.
- [ ] Message the bot from a second, non-allowlisted Telegram account —
      confirm you get no reply at all.
- [ ] Ask a question that produces a long reply — confirm it arrives as
      multiple Telegram messages, none truncated or malformed.
- [ ] Send a non-text message (a sticker or photo) from your allowlisted
      account — confirm the bot does not crash and simply ignores it.
