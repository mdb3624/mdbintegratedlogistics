# Claude Code Insights

30 sessions total, 22 analyzed, 498 messages, 3500h, 35 commits
2026-06-24 to 2026-10-01

Report: file://C:\Users\Owner\.claude\usage-data\report-2026-10-01-181333.html

## At a Glance

**What's working:** You treat your workflow like a product: you pressure-test ideas with council debates, then turn the verdicts into real shipped changes. The complexity gate is a good example. It went from a debate to a baseline scan, an automated build gate and a merged PR. Your spec-first, test-driven habit also earns its keep. It caught a real scoping gap in the Telegram bot before merge, and you push features through to verified production deploys rather than stopping at code complete.

**What's hindering you:** On Claude's side, it often got the framing wrong on content. Examples include the wrong series angle, mixing up which post was already published, and repeating the teaser. It also kept retrying HTML graphics that were never going to match an image-style reference. On your side, fragile infrastructure cost the most time: Google OAuth tokens kept expiring because the app is in Testing mode, connectors weren't loaded, and the auto-mode classifier, your own hooks and Windows quirks blocked legitimate actions until you stepped in.

**Quick wins to try:** Turn your recurring routines into Custom Skills, such as a connector preflight that confirms Gmail and Calendar are loaded and authenticated, or a "lock the framing" step before long-form drafts. Add a browser-automation MCP server so tasks like license lookups and LinkedIn checks stop dead-ending. Move your Google OAuth app out of Testing mode and pre-authorize common operations like PR merges and scheduled tasks in your permissions config.

**Ambitious workflows:** You already have personas, Gherkin stories, a complexity gate and TDD discipline. That is enough for a coordinator agent to fan out one sub-agent per story, each in its own worktree, working until its acceptance tests and the gate pass. A council agent could then review each PR before you see it. On the personal side, plan for scheduled headless runs that import statements, reconcile them against statement totals, and fix the parser when a new category appears, so you get a finished report instead of a silent failure to debug.

---

## Project Areas

### SDLC Governance Framework & Plugin Packaging (8 sessions)
Built and refined an AI-driven SDLC governance system. Work covered role and RACI docs, Fast-Track exceptions, a CRAP complexity gate wired into the build, scaffolded personas and Gherkin stories, and packaging the process as a reusable plugin with a marketplace.json. Claude handled multi-file doc edits, council-review debates and audits of the .claude setup, then shipped the work through branches and merged PRs. Friction came from auto-mode permission blocks and hook debugging.

### Telegram Bot & Product Feature Delivery (4 sessions)
Built a Telegram bot so collaborators could interact with projects, including per-user routing that scopes a collaborator to the EMA project. Specced, planned and built test-first, with 21 tests passing, and merged via PR. Separately, Claude implemented the remaining Super User stories and deployed them to production with verified health checks. It also produced stack/hosting summaries, a CDN user story and a story-ID collision audit.

### LinkedIn Article Series & Professional Communications (5 sessions)
Ran a LinkedIn series on using AI with agile, not vibe coding, for a solo MVP build. Claude planned the series, drafted and revised posts and teasers, consolidated the articles, and drafted replies to contacts and colleagues. Friction when Claude misjudged the intended framing. Repeated infographic attempts also failed to match a reference image, which needed an external image-generation tool.

### Personal Assistant: Email, Calendar, Health & Finance (5 sessions)
Worked with connected Gmail, Calendar and Drive. Scheduled an interview, added a cardiology follow-up, and managed a health vault, including MyChart export guidance. Also handled recipe tasks and a monthly credit card import, where it fixed a cardholder attribution parser bug. Google OAuth tokens expired repeatedly because the app was in Testing mode, and this blocked one session entirely. A missing browser-automation tool blocked a license verification.

### Trading Strategy Backtesting & Workspace Setup (3 sessions)
Audited a trading strategy's backtesting rigor. Claude honestly reported that the apparent edge mostly disappeared after fixing lookahead bias and did not survive multiple-testing correction. The FRED data integration was left blocked by API key requirements. Other sessions covered onboarding, cloning GitHub repos into a gitignored projects folder, and advising on where to place requirements and business-plan documents.

---

## Interaction Style

You use Claude Code as a general-purpose chief of staff rather than just a coding tool. Your 22 sessions range from Java and TypeScript feature work and production deploys to LinkedIn article series, Gmail and Calendar scheduling, health vault upkeep, recipe troubleshooting and credit card statement imports. Markdown dominates your file activity at 532 touches, compared with roughly 50 each for Java, Python and TypeScript. That shows documentation, governance and writing are your main output. Code is often the vehicle for an idea you also want to write about publicly. A typical pattern: you run a council debate on a complexity gate, have Claude scan a real CRAP baseline, wire the gate into the build, and turn it into blog posts, all shipped as PR #138 in one session.

You tend to bundle several goals into one long session and let Claude run. Sessions often chain three to five asks. One example is stack summaries, then a CDN council review, then a user story, then a full story-ID collision audit, then a colleague email. Another is an audit of your roles setup, then carrying out its recommendations, then a new background-refresh feature. You lean on structured processes you built yourself, such as /council-review --debate with six personas, SDLC governance plugins, TDD task plans and branch-plus-PR workflows. Because those guardrails are in place, you rarely micromanage individual steps. Bash (650) and Edit (335) far outnumber your 498 messages. You step in when something blocks progress, for example adjusting permissions when the auto-mode classifier stops a PR merge or a scheduled task.

Your corrections are about direction and framing, not code details. The most common friction was wrong_approach (8) and misunderstood_request (6), and most of it came from content work. You redirected a LinkedIn series from "One Person, Six AI Roles" to agile versus vibe coding. You flagged that Claude mixed up which article was published. You pushed through several infographic attempts that didn't match your NotebookLM-style reference before accepting a prompt for an external tool instead. You also care about honesty over comfort. In the trading strategy review you accepted the finding that your edge mostly disappeared after fixing lookahead bias. Satisfaction was overwhelmingly positive. Most of your dissatisfaction came from environment problems like expired OAuth tokens rather than Claude's reasoning.

**Key pattern:** You treat Claude Code as an autonomous, governance-driven chief of staff: you hand it long multi-goal sessions spanning code, docs, email and personal admin, let it run within the SDLC guardrails you built, and step in mainly to correct framing or clear permission blockers.

---

## What Works

Over 22 sessions across roughly three months, you used Claude Code as a full operating partner, spanning SDLC governance, production feature delivery, LinkedIn content, and personal admin like health records and finances.

### Council Debates Before Building
Before committing to a change, you run /council-review --debate to stress-test ideas like a complexity gate, CDN usage, or a feedback loop for improving Claude. You then act on the verdict. The complexity-gate debate turned into a real CRAP baseline scan, an automated build gate, updated SDLC docs, and blog write-ups, all shipped as PR #138. Pressure-testing a decision with multiple personas and then building on it is a mature way to cut wrong-approach rework.

### Governance-as-Code SDLC System
You built a full SDLC framework with role governance docs, RACI matrices, decision logs, Gherkin stories generated from requirements, and Fast-Track exceptions applied consistently across roles. You shipped it through branches and merged PRs. You then packaged it as a reusable plugin with a marketplace manifest and auto-reindexing hooks so your process can travel to other projects. Treating your workflow as a product you version and distribute is what lets Claude handle 11 multi-file change sessions so effectively.

### Spec-First, Test-Driven Feature Delivery
For features like the Telegram bot and the scheduled background refresh, you have Claude write a spec and plan first and then build test-first across discrete tasks. Review findings get fixed before the PR opens. This discipline caught a real path-scoping gap in the per-user routing bot, with 21 tests passing before merge. You also pushed Super User stories all the way to production with verified health checks rather than stopping at code complete.

---

## Where Things Go Wrong

Most of your friction comes from three places: auth and tool connectivity failing mid-session, Claude framing content or artifacts differently than you intended, and the auto-mode permission classifier blocking legitimate actions until you step in.

### OAuth Expiry and Unloaded Tool Connections
Your workflows depend heavily on Gmail, Calendar, Drive and other MCP integrations, and expired tokens or tools that are connected but not loaded have stalled or killed whole sessions. Moving your Google OAuth app out of Testing mode (which forces short-lived tokens) and running a quick connector health check at the start of each session would prevent most of this.
- Your session to add Clare Pitts DDS as your dentist and process your inbox produced nothing, because every request failed with "OAuth session expired and could not be refreshed".
- In the Telegram bot session, Gmail and Calendar were connected but not loaded, so you had to reload before Claude could draft and schedule. The Google token also expired again during the credit card import session because the app was still in Testing mode.

### Misread Framing on Content and Visual Artifacts
For LinkedIn posts and graphics, Claude has often guessed the wrong angle or format, and you have had to redirect it several times. Stating the core thesis, the target format (infographic, slide or summary) and the file location up front would save rounds. For image-style visuals, go straight to an external image tool instead of letting Claude iterate on HTML.
- Claude framed your series as "One Person, Six AI Roles" when you meant agile versus vibe coding. Its first post 1 rewrite repeated the teaser, and it mistook the six-roles draft for the published vibe coding article.
- Repeated infographic attempts produced a slide, then a presentation, and never matched your NotebookLM-style reference PNG. Claude finally deleted the artifact and handed you a prompt for another tool, leaving that session only partially achieved.

### Permission Classifier and Environment Blockers
The auto-mode classifier, your own scaffolded hooks, and Windows-specific quirks have repeatedly blocked legitimate actions until you intervened. Pre-authorizing common operations in your permissions config (PR merges, scheduled-task registration, agent hooks) and documenting Windows workarounds in CLAUDE.md would cut these interruptions.
- Your first PR merge for the Fast-Track governance work, the Windows scheduled-task registration, and the auto-reindex agent hook were all blocked by the auto-mode classifier until you adjusted permissions manually.
- Your freshly scaffolded hook blocked raw `find`, and Windows console encoding broke docx text extraction. Both needed workarounds, and the commit had already gone straight to main, so no PR review was possible.

---

## Suggestions

### CLAUDE.md additions

**Writing & LinkedIn content**
```
## Writing & LinkedIn content
- All drafts (articles, posts, replies, teasers) go under `projects/<project>/drafts/`. Never write them to the repo root or home directory.
- The LinkedIn series angle is **agile, disciplined AI-assisted development vs. vibe coding** for a solo MVP build. It is not 'one person, six AI roles'.
- Before drafting or reworking a post, confirm which article is already published and which one is being drafted. Never assume the newest draft is the published one.
- Do not repeat the teaser's content in the post body.
```
Why: several writing sessions needed rework: the series framing was wrong, Claude assumed the wrong article was published, a post repeated the teaser, and drafts landed outside the projects directory. Add near the top of CLAUDE.md, since documentation and writing are your most common goals (14+ sessions).

Note: this repo's CLAUDE.md already puts marketing in `projects/<name>-marketing/`, not `projects/<project>/drafts/`. Use the existing convention.

**Environment (Windows)**
```
## Environment (Windows)
- This machine runs Windows. Set `PYTHONIOENCODING=utf-8` (or use `chcp 65001`) before extracting text from docx or PDF files.
- Don't use raw `find`; a hook blocks it. Use Glob/Grep or `ctx_index` instead.
- Scheduled jobs use Windows Task Scheduler (`schtasks`). Ask the user before registering one, because auto-mode blocks it.
- No image-generation or browser-automation tool is available unless a Playwright MCP server is loaded. Say so up front instead of attempting HTML 'infographics' or background `npx playwright` runs.
```
Why: several sessions lost time to Windows encoding, the blocked `find`, scheduled-task registration, a hung Playwright run, and repeated infographic attempts that couldn't match a reference image. Add to your user-level `~/.claude/CLAUDE.md`.

**Git & PR workflow**
```
## Git & PR workflow
- Always create a feature branch before committing. Never push directly to main unless the user explicitly says so.
- Commit messages must use the conventional prefix the pre-commit hook expects (feat:, fix:, docs:, chore:, test:).
- User stories live at `docs/stories/US-###-short-name.md`. Check for ID collisions (`grep -r 'US-' docs/stories`) before assigning a new ID.
- If `gh pr merge` is blocked by the auto-mode classifier, stop and tell the user which permission to add. Don't retry blindly.
```
Why: git commit and PR merge were top goals (5 each), and friction recurred around blocked merges, a rejected commit prefix, a push straight to main that prevented a PR, and story-ID collisions. Add to the project CLAUDE.md for your SDLC-governance repos.

**Connectors / MCP preflight**
```
## Connectors / MCP preflight
- At the start of any session that uses Gmail, Calendar or Drive, check first that the MCP tools are actually loaded and authenticated.
- If OAuth has expired, tell the user immediately. The Google OAuth app is in Testing mode, so tokens expire about every 7 days.
- If tools are connected but not loaded, tell the user to reload the session before doing any drafting work.
```
Why: OAuth expiry wiped out one whole session and interrupted two others, and Gmail/Calendar tools that were connected but not loaded forced mid-session reloads. Add under `## Integrations` in your personal-assistant / health-vault project CLAUDE.md.

### Features to try

**MCP Servers.** Connect Claude to external tools, such as a real browser. Your TDLR license lookup stayed blocked and an `npx playwright` attempt hung because no browser-automation tool was loaded.
```
claude mcp add playwright -- npx @playwright/mcp@latest
```

**Custom Skills.** Reusable markdown prompts you trigger with a /command. You repeat the same multi-step workflows: LinkedIn post drafting with a fixed angle and drafts location, branch to commit to PR to merge, and the monthly credit card import with checks against statement totals.
```
# .claude/skills/cc-import/SKILL.md
---
name: cc-import
description: Import the monthly credit card statement and attribute transactions by cardholder
---
1. Ask for the statement file path if not given.
2. Parse transactions and attribute each one to a cardholder.
3. List any category strings the parser has not seen before. Do NOT silently bucket them into 'Other'.
4. Check that per-cardholder totals add up to the statement total, and report any mismatch.
5. Show a summary table before writing anything.
```

**Headless Mode.** Run Claude non-interactively from scripts or scheduled tasks. You built a scheduled refresh and do recurring memory maintenance and index refreshes. Running these through `claude -p` from Task Scheduler avoids opening interactive sessions and the auto-mode blocks you hit.
```
schtasks /Create /SC WEEKLY /D SUN /ST 09:00 /TN "ClaudeMemoryMaint" /TR "claude -p \"Review memory files, flag stale entries, and write a summary to memory/maintenance-log.md\" --allowedTools Read,Edit,Write,Glob,Grep"
```

### Usage patterns

**Lock the framing before drafting.** Ask Claude to restate the angle, audience and published-vs-draft status before it writes any long-form content. Your most common friction was "wrong approach" (8) and "misunderstood request" (6), and most of it came from writing sessions. A 30-second alignment step before drafting would have saved several rewrite rounds.
> Before drafting anything, restate in 3 bullets: (1) the core angle/thesis, (2) which pieces are already published vs. new, (3) the output format and where the file will be saved. Wait for my OK before writing.

**Run a preflight check on integrations.** Start sessions that use connectors with a quick check that the tools are loaded and authenticated. One session achieved nothing because of OAuth expiry, and others stalled on reloads or re-authentication. Your Google OAuth app is in Testing mode, so refresh tokens expire about every 7 days. Publishing the app, even unverified for personal use, or adding a preflight step stops you from discovering this mid-task.
> Preflight: confirm the Gmail, Calendar and Drive MCP tools are loaded and make one cheap read call to each. Report which ones work and which need re-auth or a session reload. Do nothing else yet.

**Hand off visual work early.** When a task needs a polished image matching a reference, have Claude write the image-tool prompt straight away instead of iterating in HTML. The infographic session went through several HTML attempts that never matched your NotebookLM-style reference PNG. Claude is strong at the content structure, copy and layout spec, so use it for that and send the rendering to an image-generation tool from the start.
> I have a reference image for an infographic. Don't try to build it in HTML. Write (1) the final copy for each panel and (2) a detailed prompt I can paste into an image-generation tool to match this style: [describe or attach reference].

**Use agents for audits and verification.** Lean on parallel subagents for repo-wide audits, like story-ID collisions and governance consistency, and for checking results against totals. Your best outcomes came from multi-file governance work (11 multi-file successes). You already use Agent 53 times. Asking explicitly for one agent per directory or role doc speeds up these audits and keeps the main context small.
> Use parallel agents, one per role doc in docs/roles/, to check each for consistency with the Fast-Track exception rules and the forward-only escalation policy. Return a single table of gaps with file:line references, then propose the edits.

---

## On the Horizon

Your usage is moving from one-off assistance toward running a full personal operating system with Claude, covering SDLC governance, council reviews, content pipelines and life admin, so the next step is to let agents work autonomously against tests, verifiers and schedules instead of waiting on you turn by turn.

### Parallel agents shipping stories against Gherkin
You already have personas, 22 Gherkin stories, a CRAP complexity gate and TDD discipline, which is enough for Claude to treat each story as a self-contained work unit. A coordinator agent could fan out one sub-agent per story, each in its own git worktree, iterating until its acceptance tests and the complexity gate pass. Each sub-agent then opens a PR that a council-review agent critiques before you see it. Your role shifts from implementing stories to approving verdicts on a queue of green, reviewed PRs.

How to try: use the Agent tool with git worktrees, so each sub-agent gets an isolated branch. Pair it with headless mode (`claude -p`) and pre-approved permissions in settings.json so the auto-mode classifier doesn't block merges or test runs mid-flight.

> Read docs/stories/ and list every US-### story that has no implementation or failing acceptance coverage. For each story (max 4 in parallel), spawn a sub-agent in its own git worktree on branch feat/US-###. Each sub-agent must: (1) translate the Gherkin scenarios into failing tests first, (2) implement until all tests pass, (3) run the CRAP complexity gate and refactor until it passes, (4) update relevant SDLC docs, (5) open a PR titled with the story ID. After all sub-agents finish, run /council-review on each PR and post the verdict as a PR comment. Finally, give me a table showing story ID, PR link, test count, CRAP score, council verdict and any blockers. Do not merge anything; I will approve.

### Self-verifying monthly finance and inbox runs
Your credit card import broke silently: all 48 transactions landed in "Other", and nothing flagged it until you noticed. Inbox and calendar work keeps dying on expired OAuth tokens. A scheduled autonomous run could import statements, reconcile categorized totals against the statement totals, and check that the "Other" share stays under a threshold. It could also fix the parser test-first when a new category string appears, then hand you a finished report instead of a debugging session.

How to try: schedule a headless `claude -p` run with Windows Task Scheduler (pre-authorized, so auto-mode doesn't block registration). Add a startup step that checks MCP auth and exits early with a re-auth notice, and move the Google OAuth app out of Testing mode so tokens stop expiring every 7 days.

> Run the monthly credit card import end to end without asking me unless blocked. Steps: (1) Verify Gmail/Drive OAuth is alive; if not, stop and write a one-line re-auth notice to inbox/ALERTS.md. (2) Import the newest statement. (3) Reconcile: per-cardholder and per-category totals must equal the statement totals exactly, and 'Other' must be under 5% of transactions. (4) If any check fails, write a failing test that reproduces it (e.g. an unrecognized promo category string), fix the parser, and re-run until all checks pass. (5) Commit with a message describing any parser change. (6) Write reports/YYYY-MM-summary.md with totals, anomalies, new categories seen and the reconciliation result. List any assumptions you made at the top.

### Autonomous content pipeline with fact-check loop
Markdown dominates your work, and your LinkedIn series, articles and docs often need correction cycles. Typical misses were the wrong angle (agile vs. vibe coding), mixing up which post was published, and repeating the teaser. A multi-agent pipeline could split the work into a drafter, a fact-checker, a voice-consistency agent and a council critic. The fact-checker verifies every claim against your repo, commits and published-posts index, and the voice agent enforces your series framing. Drafts would then arrive pre-validated, with sources, and saved in the right projects directory.

How to try: create a custom slash command or skill (e.g. /content-pipeline) that orchestrates sub-agents through the Agent tool. Store series intent and the published-post registry in CLAUDE.md or a memory file so framing and status errors can't recur.

> Create a reusable /content-pipeline skill in .claude/commands/. Inputs: topic, series name, target format (post/article/teaser). It must: (1) Load series intent and published-posts registry from docs/marketing/SERIES.md (create it if missing by scanning existing drafts and asking me only to confirm which are published). (2) Spawn a drafter sub-agent that writes the piece in docs/marketing/<series>/. (3) Spawn a fact-checker sub-agent that verifies every number, date, PR, test count and incident claim against git log, the repo and the stories, and annotates each claim with its source or flags it. (4) Spawn a framing agent that checks the draft against the series intent (e.g. agile vs. vibe coding) and rejects any repetition of earlier posts or teasers. (5) Loop the draft until the fact-check and framing agents both pass, max 3 iterations. (6) Output the final draft, a claim-to-source table and any unresolved flags. Then run it on the next post in my agile-solo-MVP series.

Note: this repo stores marketing under `projects/<name>-marketing/`, not `docs/marketing/`. Adjust paths before using.

---

## Fun Ending

**In a single sitting, Claude diagnosed why the brownies came out wrong, saved a chickpea salad recipe, and then tracked down why all 48 credit card transactions had been filed under "Other."**

This was a long multi-task session that mixed recipe help with a monthly statement import. A new promo category string had quietly broken the cardholder attribution parser. Claude also had to re-authenticate Google OAuth partway through, because the app was still in Testing mode. It then fixed the parser and checked the results against the statement totals.
