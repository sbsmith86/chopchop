# ChopChop

# Technical Design Document

**Project:** Universal Issue Decomposer SPA

**Owner:** sbsmith86

**Date:** 2025-08-02

---

## **1. Overview**

Build a browser-only React SPA that takes a GitHub issue, asks clarifying questions, generates a granular, reviewable execution plan, breaks the plan into small ordered tasks (with guardrails), and (on approval) auto-creates issues in a configured GitHub repo.

No backend; all logic and persistence is client-side. The tool is for your personal/local use only.

---

## **2. Functional Requirements**

### **User Flow**

1. **Paste a GitHub issue URL or Markdown.**
2. **App parses the issue and (using OpenAI) generates clarifying questions.**
3. **User answers questions (in-app forms).**
4. **App proposes an execution plan (high-level step-by-step), using OpenAI.**
5. **User reviews/edits plan in a rich text editor (required step).**
6. **App breaks plan into atomic, ordered subtasks, each with guardrails and acceptance criteria (OpenAI-assisted and rule-based).**
    - **Warns if any subtask is “too big.”**
    - **Lets user split subtasks further in the UI.**
7. **Shows a final ordered list of subtasks (editable Markdown fields).**
8. **On approval, app uses stored GitHub PAT to auto-create issues in the configured repo.**
9. **Plan and settings are persisted in a config file (on local filesystem via browser APIs like File System Access, or in-memory/downloadable config).**

---

### **Key Features**

- **Clarification questions** generated and displayed before plan creation.
- **Rich text/Markdown editor** for plan review and editing.
- **Subtask “smallness” warnings** (detects multiple actions/resources per subtask).
- **Subtask splitting and inline editing.**
- **Config section:**
    - Set GitHub PAT
    - Set default repo
    - Download/upload config
    - (Optionally) set other preferences (output mode, editor theme, etc.)
- **Auto-create issues** via GitHub REST API.
- **Local config persistence (not exposed in UI or network logs).**

---

## **3. Non-Functional Requirements**

- **Browser-only** (no server/backend).
- **Modern, clean UI (Tailwind).**
- **No analytics or tracking.**
- **No support for multiple users, teams, or multiple repos.**
- **All tokens/config kept local and never exposed in UI/console logs.**
- **No PII sent to OpenAI unless present in user-supplied tickets.**

---

## **4. Architecture**

### **Frontend**

- **Framework:** React (functional components, hooks)
- **Styling:** Tailwind CSS
- **Editor:** [react-markdown](https://github.com/remarkjs/react-markdown) or [react-simplemde-editor](https://github.com/RIP21/react-simplemde-editor) for plan/subtask editing
- **Drag-and-drop:** dnd-kit or [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd) for subtask reordering
- **Config File:**
    - Use File System Access API if supported, or let user export/import config as a JSON file

### **APIs & Integrations**

- **OpenAI API** for:
    - Clarification question generation
    - Plan synthesis
    - (Optional) initial subtask breakdown
- **GitHub REST API** for:
    - Issue creation (using stored PAT)
    - Issue linking

---

### **Component Structure (Sample)**

- **AppShell**
    - **ConfigPanel**
    - **IssueInputPanel**
    - **ClarificationQuestionPanel**
    - **PlanReviewEditor**
    - **SubtaskListPanel**
        - **SubtaskCard** (inline edit, split, delete)
    - **ExecutionOrderPanel**
    - **Summary/ApprovalPanel**

---

## **5. Core Logic Flows**

### **Clarification Questions**

- On issue load, extract key nouns, missing fields, and unclear requirements via prompt to OpenAI.
- Render as a stepper/form for user input.

### **Plan Generation**

- Use issue text + user answers as input for an OpenAI prompt:
    - “Given this issue and these clarifications, create an ordered step-by-step high-level execution plan.”
- Show result in Markdown editor; require user to approve or edit.

### **Subtask Breakdown**

- Use OpenAI (and rules) to split each plan step into atomic tasks:
    - “Split each step into the smallest actionable engineering tasks, where each can be completed in under 2 hours and only affects a single component or file.”
    - For each, add standard guardrails (“Do not touch unrelated files...”).
- Flag tasks as “too big” if:
    - Contains “and”, “or”, or >1 resource/action.
    - User can split any such task in the UI (generates more subtask cards).

### **Execution Order**

- Default to plan order; allow drag-and-drop reordering before approval.

### **Issue Creation**

- On approval, use stored PAT to create issues in the configured repo.
- Include links/parent/child references if needed.
- Show summary and links after completion.

---

## **6. Security Considerations**

- PAT is never exposed in UI after entry—only stored in local config file (never checked into git or sent to remote APIs).
- OpenAI calls do not include more user data than necessary.
- All config persisted locally (using browser storage, or File System Access API if available).

---

## **7. Limitations/Out of Scope**

- **No multi-user or collaboration features.**
- **No analytics, telemetry, or cloud storage.**
- **No support for Jira, Linear, Trello, etc.**
- **No multi-repo support (just one at a time).**
- **No custom branding or theming beyond “clean/modern.”**

---

## **8. Future Improvements (Not Required Now)**

- Team/multi-user support.
- API for different project management integrations.
- Serverless or desktop/Electron packaging.
- More advanced LLM controls/configs.
- Model and persist execution history (for auditing/planning).

---

## **9. Open Questions / Risks**

- **File System Access API** is not universally supported; fall back to config import/export.
- **Rate limits** on OpenAI or GitHub APIs if used heavily (not likely for solo use).
- **LLM “hallucination” risk**—final plans/subtasks should always be user-reviewed.

---

## **10. Next Steps**

- (Optional) Create wireframes for core screens:
    - Issue input/clarification
    - Plan review/editor
    - Subtask review/splitting
    - Config panel
- Create initial React app with Tailwind, config file persistence, and basic OpenAI/GitHub API integrations.

---

# **END OF DOCUMENT**