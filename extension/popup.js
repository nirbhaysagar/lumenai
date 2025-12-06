document.addEventListener('DOMContentLoaded', async () => {
    const titleEl = document.getElementById('page-title');
    const urlEl = document.getElementById('page-url');
    const clipBtn = document.getElementById('clip-btn');
    const statusEl = document.getElementById('status');

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
        titleEl.textContent = tab.title || 'Unknown Title';
        urlEl.textContent = tab.url || 'Unknown URL';
    }

    const clipSelBtn = document.getElementById('clip-sel-btn');
    const screenshotBtn = document.getElementById('screenshot-btn');

    const handleClipAction = async (type) => {
        try {
            statusEl.className = 'status hidden';
            statusEl.textContent = '';

            let payload = {
                title: tab.title,
                url: tab.url,
                userId: '11111111-1111-1111-1111-111111111111' // Hardcoded for alpha
            };

            const isTwitter = tab.url.includes('twitter.com') || tab.url.includes('x.com');

            if (type === 'page') {
                clipBtn.disabled = true;
                clipBtn.textContent = 'Clipping...';

                if (isTwitter) {
                    // Twitter Specific Extraction
                    const [{ result }] = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            const tweets = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
                            return tweets.map(t => t.innerText).join('\n\n---\n\n');
                        },
                    });
                    payload.text = result || 'No tweets found';
                    payload.type = 'tweet_thread';
                } else {
                    // Generic Page with Readability
                    // 1. Inject Readability
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['lib/Readability.js']
                    });

                    // 2. Parse
                    const [{ result }] = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            try {
                                // @ts-ignore
                                const reader = new Readability(document.cloneNode(true));
                                const article = reader.parse();
                                return article ? article.textContent : document.body.innerText;
                            } catch (e) {
                                return document.body.innerText; // Fallback
                            }
                        },
                    });
                    payload.text = result;
                    payload.type = 'article';
                }
            } else if (type === 'selection') {
                clipSelBtn.disabled = true;
                clipSelBtn.textContent = 'Clipping...';
                const [{ result }] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => window.getSelection().toString(),
                });
                if (!result) throw new Error('No text selected');
                payload.text = result;
                payload.type = 'selection';
            } else if (type === 'screenshot') {
                screenshotBtn.disabled = true;
                screenshotBtn.textContent = 'Capturing...';
                const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
                payload.image = dataUrl; // Base64
                payload.type = 'image';
            }

            // Send to Background
            const response = await chrome.runtime.sendMessage({
                action: 'clip_page',
                data: payload
            });

            if (response.success) {
                statusEl.textContent = 'Saved to Lumen!';
                statusEl.className = 'status success';
            } else {
                throw new Error(response.error || 'Unknown error');
            }

        } catch (error) {
            console.error(error);
            statusEl.textContent = 'Error: ' + error.message;
            statusEl.className = 'status error';
        } finally {
            clipBtn.disabled = false;
            clipBtn.textContent = 'Clip Page';
            clipSelBtn.disabled = false;
            clipSelBtn.textContent = 'Clip Selection';
            screenshotBtn.disabled = false;
            screenshotBtn.textContent = 'Screenshot';
        }
    };

    clipBtn.addEventListener('click', () => handleClipAction('page'));
    clipSelBtn.addEventListener('click', () => handleClipAction('selection'));
    screenshotBtn.addEventListener('click', () => handleClipAction('screenshot'));
});
