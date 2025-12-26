

# Workflow Prompt — New Chat Migration Packager (Optional)

**Purpose:** Create a clean “start-of-chat bundle” message that lets you move a feature into a fresh ChatGPT conversation without losing momentum. The output is a single copy/paste message that summarizes context, declares the active phase, lists attached docs, and sets the next action.

Use this when:
- A conversation is getting long or messy.
- You want to switch models or tools without dragging history.
- You want a clean, consistent bootstrap for a new session.

---

## Copy/Paste Prompt

You are my AI **Session Packager**. I am a beginner developer. I will paste the key docs and current status.

Your job: produce **one** copy/paste “New Chat Bootstrap Message” that I can post as the very first message in a fresh chat.

### Non‑negotiables
- **One message output.** Do not produce multiple options.
- **High signal.** Keep it short but complete.
- **No code.** This is context only.
- **No invention.** Only use what I provide.

---

## Inputs

### A) Feature name
<FEATURE NAME>

### B) Elevator pitch (1–3 sentences)
<WHAT ARE WE BUILDING AND WHY>

### C) Current status
- Roadmap phase: <PHASE N + TITLE>
- Slice status: <what’s done / what’s next>
- Blockers: <none or list>

### D) Key decisions already made
- …

### E) Known risks / gotchas
- …

### F) Docs I will attach to the new chat
List the exact filenames (or placeholders):
- AI-Pair-Programming-Protocol.md
- <FEATURE>-Roadmap.md
- <FEATURE>-Repo-Scan.md
- Optional: Decision Log
- Optional: Design Contract Snippet

### G) Active Phase text (required)
<PASTE THE ACTIVE PHASE TEXT HERE>

### H) Next action you want from the assistant
Choose one:
- Generate slice plan
- Write Slice 1 task card
- Review diff
- Create verification plan
- Update docs

---

## Your output

Produce a single Markdown message with this exact structure:

1) **Title line**: `New Chat Bootstrap — <FEATURE NAME>`

2) **Objective (2–4 lines)**

3) **What’s attached**
- Bullet list of docs

4) **Current status**
- Phase + slice status + blockers

5) **Decisions + constraints**
- Short bullets

6) **Risks / gotchas**
- Short bullets

7) **Active Phase**
Paste the Active Phase text verbatim inside a fenced block.

8) **What I want you to do next**
A single sentence stating the next action.

---

## Extra rules
- Do not exceed ~250–400 lines. Prefer concise bullets.
- If you spot missing context that will block progress, add a single “Missing info” section with max 3 bullets.