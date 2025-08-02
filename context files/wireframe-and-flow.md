# Wireframe and flow

## **1. Settings / Configuration Panel**

```
less
CopyEdit
┌────────────────────────────┐
│   ⚙️  Settings / Configuration   │
├────────────────────────────┤
│ [ GitHub Repo ]:        [ PrimrCo/primr-events          ] │
│ [ GitHub PAT  ]:        [ ••••••••••••••••••••••••••••• ] │
│ [ OpenAI API Key ]:     [ ••••••••••••••••••••••••••••• ] │
│                                            [Save]        │
│──────────────────────────────────────────────────────────│
│ [ Download Config ]   [ Upload Config ]                  │
└────────────────────────────┘

```

---

## **2. Issue Input Screen**

```
pgsql
CopyEdit
┌───────────────────────────────┐
│   📝  Start New Decomposition       │
├───────────────────────────────┤
│ Paste GitHub Issue URL or Markdown:         │
│ ┌─────────────────────────────────────────┐ │
│ │ [                                   ]   │ │
│ └─────────────────────────────────────────┘ │
│ [ Load Issue ]                              │
└───────────────────────────────┘

```

---

## **3. Clarification Questions Step**

```
markdown
CopyEdit
┌────────────────────────────────────────────┐
│   ❓  Clarifying Questions                       │
├────────────────────────────────────────────┤
│ 1. Which fields in which models are considered sensitive?   │
│    [______________________________]                       │
│ 2. Do you have an encryption key manager?                  │
│    ( ) Yes   ( ) No                                        │
│ 3. Should existing data be migrated or just new data?      │
│    [______________________________]                       │
│ [Continue]                                                │
└────────────────────────────────────────────┘

```

---

## **4. Execution Plan Review/Edit**

```
scss
CopyEdit
┌────────────────────────────────────────────┐
│   🛠️  Plan of Execution (Review & Edit)         │
├────────────────────────────────────────────┤
│ "First, implement encryption utilities.    │
│  Then, build key manager...                │
│  ..."                                      │
│                                             │
│ [Markdown/Rich Text Editor]                 │
│────────────────────────────────────────────│
│ [Save & Continue]                          │
└────────────────────────────────────────────┘

```

---

## **5. Subtask Breakdown (Review, Split, Order)**

```
css
CopyEdit
┌────────────────────────────────────────────┐
│   📋  Subtasks (Review, Split, Order)           │
├────────────────────────────────────────────┤
│  1. Implement AES-256 Encryption Utility         [Edit] [Split] [Delete] │
│     🚫 Guardrails...                                                 │
│  2. Build Key Manager Utility                        [Edit] [Split] [Delete] │
│     🚫 Guardrails...                                                 │
│  3. Update User model for email encryption            [Edit] [Split] [Delete] │
│     🚫 Guardrails...                                                 │
│ ... (Drag and drop to reorder)                                   │
│────────────────────────────────────────────│
│ [Back]      [Approve & Create Issues]                         │
└────────────────────────────────────────────┘

```

---

## **6. Confirmation / Results Screen**

```
pgsql
CopyEdit
┌────────────────────────────────────────────┐
│   ✅  Issues Created                              │
├────────────────────────────────────────────┤
│ Subtasks successfully created in GitHub!          │
│ [List with links to each created issue]           │
│                                                  │
│ [Start New Decomposition]                        │
└────────────────────────────────────────────┘

```

---

## **Navigation Flow**

```
css
CopyEdit
[ Settings ] ←→ [ Issue Input ] → [ Clarification Qs ] → [ Plan Review ] → [ Subtasks ] → [ Confirmation ]

```

---

## **Notes**

- The user can access **Settings** at any time from the top nav.
- **Every “Continue”** or “Approve” step must complete before moving on (plan review is required).
- **Subtasks** can be edited or split inline; tasks flagged as “too big” get a warning (“This task may need to be split”).
- On the **Subtask screen**, drag-and-drop for ordering, with an “Approve” button to finalize.