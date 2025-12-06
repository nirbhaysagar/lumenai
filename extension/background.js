chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'clip_page') {
        handleClip(request.data).then(sendResponse);
        return true; // Keep channel open for async response
    }
});

async function handleClip(data) {
    try {
        const response = await fetch('http://localhost:3000/api/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: data.userId,
                type: data.type || 'text',
                text: data.text,
                image: data.image, // Base64 for screenshots
                title: data.title,
                url: data.url,
                contextId: null
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            return { success: false, error: result.error || 'API Error' };
        }

        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
