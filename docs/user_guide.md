# Lumen AI User Guide

Welcome to **Lumen AI**, your active memory augmentation platform. This guide will help you navigate the features we have built to help you capture, organize, and recall your knowledge.

---

## 1. The Dashboard
Your command center. Here you get a high-level view of your "Second Brain."

- **Universal Input**: The large bar at the top. Use this for everything (see below).
- **Knowledge Radar**: A pentagon chart in the right sidebar. It visualizes the health of your memory bank (Volume, Connectivity, Diversity, etc.).
- **Daily Refresher**: A widget that quizzes you on items due for review (Spaced Repetition).
- **Recent Activity**: A feed of your latest uploads and notes.

---

## 2. Universal Input
Located at the top of the dashboard, this is your primary way to interact with Lumen. It has "Smart Mode Detection":

- **Chat Mode**: Type a question (e.g., *"What did I learn about React?"*). The system will search your memories and generate an answer.
- **Ingest Mode**: Type `/add` followed by text (e.g., *"/add Remember to buy milk"*). Press `Cmd+Enter` to save it instantly as a note.
- **Search Mode**: Type keywords to find specific captures.

---

## 3. Ingestion (Adding Memories)
You can add data in multiple ways:

- **Quick Note**: Use the Universal Input with `/add`.
- **File Upload**: Go to the **Ingest** page (via Quick Actions) to upload PDFs, Images, or Paste URLs.
- **Processing**: Once added, our background workers automatically:
    - **Chunk** the text into bite-sized pieces.
    - **Embed** it for semantic search.
    - **Extract** concepts for the Knowledge Graph.

---

## 4. Memory Intent Layer (Active Memory)
Don't just store data—tell Lumen what to do with it.

1.  Open any **Capture** from the "Recent Activity" or "Captures" page.
2.  Click the **"Memory"** button (Lightning icon) in the header.
3.  **Set a Directive**:
    - **Trigger**: When should this resurface? (e.g., "Time: Next Week" or "Topic: When I read about 'Sales'").
    - **Action**: What should happen? (e.g., "Surface" in dashboard, "Notify" me).
    - **Priority**: How important is this?
4.  Click **Save**. Lumen will now actively watch for this trigger.

---

## 5. Knowledge Graph
Lumen connects the dots for you.

- **Concepts**: The system automatically identifies key entities (People, Tech, Projects) in your uploads.
- **Relations**: It maps how they are related (e.g., "Next.js" *is a framework for* "React").
- **Visualization**: The **Knowledge Radar** on the dashboard shows you:
    - **Connectivity**: How well-linked your ideas are.
    - **Diversity**: How many unique topics you cover.
    - **Freshness**: How recently you've added new knowledge.

---

## 6. Recall (Spaced Repetition)
Keep your memories sharp.

- **Daily Refresher**: On the dashboard, you will see a card asking you to review a specific memory.
- **Review**: Click "Reveal Answer" and rate how well you remembered it (1 = Forgot, 5 = Easy).
- **Algorithm**: Lumen uses a spaced repetition algorithm (SuperMemo-2) to schedule the next review at the optimal time to prevent forgetting.

---

## 7. Contexts (Projects)
Organize your memories into scopes.

- **Create Context**: Use the "New Context" button to create a workspace (e.g., "Work", "Personal", "Learning").
- **Assign Memories**: In a Capture detail page, use the "Assign" button to add specific chunks to a Context.
- **Focus**: Switch contexts in the header to filter your Chat and Search results to just that project.
