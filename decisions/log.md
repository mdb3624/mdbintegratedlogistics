# Decisions Log

Append-only record of meaningful decisions and why they were made. `/level-up` Phase 2 (Method interview) writes scoped automation specs here. You can also append manually whenever you decide something worth remembering.

**Format per entry:**

```
## YYYY-MM-DD — Short title

**Decision:** what was decided.

**Why:** the reasoning, constraints, and what would change your mind.

**Alternatives considered:** what else was on the table.

**Owner:** who's accountable.
```

Keep it terse. Future-you will thank present-you for capturing the *why*, not just the *what*.

---

## 2026-10-01 — Accept interview with Salma (book on agentic software development)

**Decision:** Accepted a 30-minute video call with Salma (author researching a book on how AI changes software development) for Wed 2026-10-07, 1:00 PM CT, via Google Meet. Quotes are reviewed by Mike before use, with named or anonymous chosen at that point.

**Why:** Free exposure to a book audience that matches the vibe-coding series (engineering leaders adopting AI). She picked up the builder/reviewer split from the published article. Attribution control stays with Mike, so there is little downside. Would reconsider if the quote-review promise is dropped.

**Alternatives considered:** Decline, or defer until the series is further along. Offered Oct 5 at 10 AM as another slot, not used.

**Owner:** Mike

## 2026-10-05 — Casual voice guide for /content-pipeline drafts (level-up spec)

**Decision:** Build `references/voice-casual.md` as a prompt-only voice guide (autonomy L2: AI drafts, Mike edits). The drafter loads it alongside `references/voice.md`.

**Why:**
- Constraint: series drafts come out stilted and need many edit passes (Post 3 took 7+). Published articles all felt stiff to Mike, so they are not valid voice samples.
- EAD: Automate the rules (contractions, short paragraphs, ban list). Eliminate nothing. Delegate nothing.
- Process map: trigger = drafting a series piece. Data = Mike's real sent mail (2025-2026) plus rewrites he supplies. Transformation = draft must match the guide. Decision = Mike approves every draft. Destination = `projects/<project>-marketing/<series>/`.
- KPI: bucket = less cost. Metric = edit passes per post. Baseline 7+ (Post 3). Target 2 or fewer.
- Gmail sent folder starts Dec 2017 and has nothing from 2009-2011, so no 2010 recruiter mail was available. Best samples are short logistics emails.
- Still open: no long-form technical sample. Plan is a 3-minute voice memo on the next post, transcribed.
- Separate problem logged, not solved here: first-pass factual accuracy. Candidate for a later run: fact-sheet-first drafting from the current clone.

**Alternatives considered:** Fact-sheet-first pipeline (deferred to a later run). Spec analysis (Mike's stated top pain, not chosen this week). Feeding published articles as samples (rejected, Mike finds them stilted).

**Owner:** Mike

## 2026-10-08 — Salma interview becomes the spoken technical voice sample

**Decision:** Use the transcript of the 2026-10-07 Salma interview as the long-form technical voice sample. Distilled into `references/voice-spoken.md` (Mike's lines only, approved). Raw transcript kept in `references/voice-samples/` and gitignored. `/content-pipeline` drafters now load `voice.md`, `voice-casual.md`, and `voice-spoken.md`.

**Why:**
- Closes the open gap from the 2026-10-05 voice guide decision: no long-form technical sample existed, and the published articles are not valid samples.
- It is the closest thing to Mike explaining the method in his own words, unscripted.
- Spoken is not written. The guide says to use it for logic and word choice and to cut filler.
- The transcript has a third party's words and Salma's redactions, so only the distilled file is meant to be tracked.

**Alternatives considered:** Wait for a 3-minute voice memo on the next post (still useful, not blocked on). Track the raw transcript in git (rejected for privacy).

**Open:** Verify story count, timeline, and cost claims against the repo before quoting them. Don't quote Salma. Her book content that mentions Mike comes to him for review before publishing, per her promise. Measure edit passes per post on the next series piece (baseline 7+, target 2 or fewer).

**Owner:** Mike
