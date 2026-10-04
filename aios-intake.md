# AIS-OS Intake

This is the source-of-truth file for your AIOS. Fill it in by typing, voice-pasting (Wispr Flow / OS dictation), or running `/onboard` for a guided conversation. Whichever mode, this file is what `/onboard` reads to scaffold your Day-1 setup.

**Hard cap: 7 questions.** Each answerable in under 60 seconds. Don't overthink — you can edit and re-run `/onboard` any time.

---

## Q1 — Who are you, what do you sell, who do you sell it to?

Identity, offer, ICP. One paragraph each is fine.

```
Mike Barnes (Mike). I sell AI-powered services and products, built out of my work on mdbfreightclub / FreightClub. Current target customer: carriers in the trucking industry. I'm also evaluating branching into other verticals where AI can add value, based on what I've learned building the trucking product.
```

---

## Q2 — Paste 1-2 things you've written recently. Don't edit them.

An email, a LinkedIn post, a DM, a doc — anything that sounds like you when you're not trying. **Paste verbatim.** Do not type these mid-conversation with Claude — chat-shaped samples are worse than no samples (voice contamination).

```
Hi Vic,it was nice meeting you today at the unscripted conference.

I have published a serious of articles describing how i built my product and have published them on my LinkedIn profile of you are interested in what i have been doing with Ai. To see the finale results of my AI journey go to http://www.mdbfreightclub.com

If you have any questions feel free to reach out to me by either

Email: mdb3634@gmail.com
Phone: (404) 960-9631
```

```
Hi Diane,

Hope you and your family are well.

I'm excited to share that Hong and I are launching our new company this Friday, May 29th. We're building AI-powered business applications designed specifically for small and mid-sized companies, with specialized solutions for marketing automation, sales management, advertising campaign optimization, and logistics operations.

Our flagship product, FreightClub, demonstrates our approach: it was built entirely using cutting-edge AI development tools, including Claude and Second Brain, which allowed us to deliver a fully-featured platform efficiently.

We're focusing on solving real operational challenges that these companies face daily, and we're confident that our AI-first methodology will set us apart.

I'd love to get your feedback on our business plan attached. Specifically, I'd value your thoughts on:

• Cold board seeding risk: Do you see the broker partnership + geographic beachhead approach as sufficient to overcome the two-sided marketplace cold start problem, or should we be pursuing additional load sources?

• Competitive positioning: How credible is our differentiation against DAT/Truckstop on cost, and against Uber Freight on the 1.5–2% fee vs. their 12–20% broker margin?

• GTM priorities: We're targeting OOIDA forums, r/Truckers, and Facebook groups. Are there other communities or channels where independent owner/operators actively seek solutions?

• Revenue timing: Do you think Phase 5 (payments) by month 2 is aggressive, or is this realistic given our current MVP state?

• Anything else: Any blind spots in our market analysis, positioning, or execution plan that stand out to you?

Thanks
Mike Barnes
(404) 960-9621
```

---

## Q3 — What are your 2-3 biggest priorities for the next 90 days?

Quarterly priorities. Not yearly aspirations. Things that, if not done by July, would make you say "I wasted Q2."

```
1. Get a marketing strategy running with Danny Chris for mdbfreightclub.
2. Finish an MVP with Danny Chris (new collaboration).
```

---

## Q4 — Where does revenue actually land, and where is it tracked?

Multiple answers OK. Stripe? Skool? GoHighLevel? QuickBooks? A spreadsheet?

```
Not determined at this time.
```

---

## Q5 — Where do you talk to customers, your team, and the outside world day-to-day?

Email (which one — Gmail / Outlook)? Slack? Teams? DMs (Skool / Discord / iMessage)? Phone?

```
Gmail.
```

---

## Q6 — Where do meeting recordings, notes, and important docs live?

Granola? Otter? Fireflies? Google Drive? Notion? Dropbox? A folder on your desktop you keep meaning to organize?

```
Local project folders (this working directory / repo structure).
```

---

## Q7 — What's the one task that eats your week, and where do you currently track work?

The single biggest time-suck or recurring drudgery. Plus where tasks/projects live (ClickUp / Asana / Linear / Notion / a notebook).

```
Top pain: spec analysis. Tasks/projects tracked in local project folders (this repo).
```

---

When this file is filled, run `/onboard` (or re-run it) and the wizard will scaffold your Day-1 file set: `context/`, `references/voice.md`, populated `connections.md`, and a filled `CLAUDE.md`.
