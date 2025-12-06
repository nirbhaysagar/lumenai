export interface StreamCallbacks {
    onToken: (token: string) => void;
    onMetadata: (metadata: any) => void;
    onError: (error: Error) => void;
    onComplete: () => void;
}

export async function fetchStreamingChat(
    url: string,
    payload: any,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Check for metadata at the end of the stream
            // The protocol expects metadata to be the last part, possibly separated by newlines
            // or just appended. We'll look for a JSON object at the end.

            // Heuristic: If we see a large JSON object at the end, it might be metadata.
            // However, the prompt says: "LLM stream sends plain text frames. At the end, LLM sends a final JSON frame wrapped in a sentinel (e.g., __METADATA__{...}) OR \n\n{"metadata":...}."
            // Let's assume the API sends \n\n{"metadata":...} or similar JSON structure at the very end.

            // We will process the buffer to extract tokens and keep potential metadata in buffer if incomplete.
            // Actually, for simple streaming, we can just emit tokens.
            // But we need to detect the final JSON.

            // Let's try to parse the buffer as we go, or just emit everything as tokens 
            // EXCEPT the final JSON block.

            // Since we don't know exactly when the JSON starts without a sentinel, 
            // we'll rely on the "StreamData" from 'ai' SDK which usually sends data as a specific protocol.
            // BUT the user prompt says: "Streaming mode sends partial text frames and finishes with final JSON metadata frame."

            // If the server uses `streamText` with `StreamData` from `ai` SDK (as seen in `api/chat/route.ts`),
            // the output format is actually a specific protocol (text stream + data stream).
            // The `ai` SDK's `useChat` hook handles this automatically.
            // BUT the user wants a custom `ChatClient` and `streamingFetch`.

            // If we are using `streamText` + `StreamData` (Vercel AI SDK), the response is a stream of parts.
            // Text parts: `0:"text"`
            // Data parts: `2:[{"sources":...}]`

            // WAIT: The `api/chat/route.ts` uses `result.toDataStreamResponse({ data })`.
            // This means it uses the Vercel AI SDK Data Stream Protocol.
            // We should probably use `useChat` from `ai/react` if allowed, but the prompt says:
            // "Call /api/chat with fetch streaming (ReadableStream) and progressively append text tokens... When stream ends, parse final JSON metadata frame".

            // If we MUST implement `streamingFetch` manually for Vercel AI SDK protocol:
            // The protocol is line-based:
            // 0:"text chunk"
            // e:{"finishReason":"..."}
            // 2:[data json]

            // Let's implement a parser for this protocol.

            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

            for (const line of lines) {
                if (!line.trim()) continue;

                // Parse Vercel AI SDK protocol
                // 0: "text"
                // 2: [data]

                const match = line.match(/^(\d+):(.*)$/);
                if (match) {
                    const type = match[1];
                    const content = match[2];

                    if (type === '0') {
                        // Text chunk
                        // Content is JSON stringified string
                        try {
                            const text = JSON.parse(content);
                            callbacks.onToken(text);
                        } catch (e) {
                            console.warn('Failed to parse text chunk:', content);
                        }
                    } else if (type === '2') {
                        // Data chunk
                        try {
                            const data = JSON.parse(content);
                            // The data is an array of items appended to StreamData
                            // In our route, we appended one item: { sources: ... }
                            if (Array.isArray(data) && data.length > 0) {
                                callbacks.onMetadata(data[0]);
                            }
                        } catch (e) {
                            console.warn('Failed to parse data chunk:', content);
                        }
                    }
                }
            }
        }

        // Process remaining buffer if any (should be empty usually)
        if (buffer.trim()) {
            const match = buffer.match(/^(\d+):(.*)$/);
            if (match) {
                const type = match[1];
                const content = match[2];
                if (type === '0') {
                    try {
                        const text = JSON.parse(content);
                        callbacks.onToken(text);
                    } catch (e) { }
                } else if (type === '2') {
                    try {
                        const data = JSON.parse(content);
                        if (Array.isArray(data) && data.length > 0) {
                            callbacks.onMetadata(data[0]);
                        }
                    } catch (e) { }
                }
            }
        }

        callbacks.onComplete();

    } catch (error: any) {
        if (error.name === 'AbortError') {
            // Ignore abort errors
            return;
        }
        callbacks.onError(error);
    }
}
