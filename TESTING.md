# Testing Guide - Chat UI

## Acceptance Criteria

### 1. Streaming Response
- [ ] **Action**: Send a message in the chat.
- [ ] **Expected**:
    - Assistant message appears immediately with a blinking cursor.
    - Text streams in token-by-token.
    - "Thinking..." indicator shows if there's a delay.
    - Cursor disappears when streaming ends.

### 2. Citations & Sources
- [ ] **Action**: Wait for a response that uses sources.
- [ ] **Expected**:
    - Inline citations appear under the assistant message (e.g., "📄 Title (90%)").
    - Clicking a citation opens the Source Modal.
    - Modal shows full text, metadata, and topics.
- [ ] **Action**: Click "Use in chat" in the modal.
- [ ] **Expected**:
    - Modal closes.
    - Source text is appended to the input box as a quote.

### 3. Actions (Summary & Export)
- [ ] **Action**: Click "Save as Summary" on an assistant message.
- [ ] **Expected**:
    - Toast appears: "Generating summary...".
    - Toast updates to: "Summary saved successfully!".
- [ ] **Action**: Click "Export" -> "Markdown".
- [ ] **Expected**:
    - Browser downloads a `.md` file.
    - File contains formatted message and footnotes for sources.
- [ ] **Action**: Click "Export" -> "JSON".
- [ ] **Expected**:
    - Browser downloads a `.json` file with structured data.

### 4. Queue & Backlog
- [ ] **Action**: Simulate a queue backlog (mock API or high load).
- [ ] **Expected**:
    - "Thinking..." indicator shows a badge: "Queue: N — est Xs".

### 5. Error Handling
- [ ] **Action**: Simulate a network error during streaming.
- [ ] **Expected**:
    - Toast error appears.
    - UI remains stable (does not crash).

## Manual Test Steps

1.  **Navigate to Chat**: Go to `http://localhost:3000/chat/default`.
2.  **Send Message**: Type "What is the capital of France?" and hit Enter.
3.  **Verify Stream**: Watch the text appear.
4.  **Check Citations**: If RAG is working, check for citations.
5.  **Test Modal**: Open a citation and use the text.
6.  **Export**: Download the conversation snippet.

## OCR Testing

### 1. UI Method (End-to-End)
- [ ] **Action**: Go to `http://localhost:3000/ingest`.
- [ ] **Action**: Select "Image" tab (or drag & drop).
- [ ] **Action**: Upload an image containing text (e.g., a screenshot of a document).
- [ ] **Expected**:
    - Toast appears: "Ingestion queued".
    - Go to `http://localhost:3000/captures`.
    - The new capture should appear.
    - Click it to view details. The "Raw Text" section should contain the extracted text.

### 2. Script Method (Unit Test)
- [ ] **Action**: Run the provided test script:
    ```bash
    npx tsx scripts/test-ocr.ts
    ```
- [ ] **Expected**:
    - Script reads the test image.
    - Output shows "OCR Result:" followed by the text found in the image.

