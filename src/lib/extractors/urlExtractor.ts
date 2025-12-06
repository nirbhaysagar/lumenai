import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { YoutubeTranscript } from 'youtube-transcript';

export async function extractFromUrl(url: string): Promise<{ title: string; content: string }> {
    try {
        // 1. Handle YouTube URLs
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(url);
                const text = transcript.map(item => item.text).join(' ');

                // Fetch title separately
                const response = await fetch(url);
                const html = await response.text();
                const dom = new JSDOM(html);
                const title = dom.window.document.title.replace(' - YouTube', '') || 'YouTube Video';

                return {
                    title,
                    content: `[YouTube Transcript]\n\n${text}`
                };
            } catch (ytError) {
                console.warn('YouTube transcript fetch failed, falling back to page text:', ytError);
                // Fallback to normal extraction if transcript fails
            }
        }

        // 2. Handle General URLs with Readability
        console.log('Fetching URL:', url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        console.log('URL fetched, length:', html.length);

        const dom = new JSDOM(html, { url });
        console.log('JSDOM created');
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        console.log('Readability parsed:', article ? 'success' : 'failed');

        if (article) {
            return {
                title: article.title || dom.window.document.title,
                content: (article.textContent || '').trim()
            };
        }

        // 3. Fallback to basic body text
        const text = dom.window.document.body.textContent || '';
        return {
            title: dom.window.document.title || url,
            content: text.replace(/\s+/g, ' ').trim()
        };

    } catch (error) {
        console.error('Error fetching URL:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch URL content');
    }
}
