let clipButton = null;

document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
        // Remove existing button if any
        if (clipButton) clipButton.remove();

        // Create button
        clipButton = document.createElement('button');
        clipButton.id = 'lumen-clip-btn';
        clipButton.textContent = 'Add to Lumen';

        // Position button
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        clipButton.style.top = `${window.scrollY + rect.bottom + 10}px`;
        clipButton.style.left = `${window.scrollX + rect.left}px`;

        // Add click handler
        clipButton.addEventListener('mousedown', async (e) => {
            e.preventDefault(); // Prevent losing selection
            e.stopPropagation();

            clipButton.textContent = 'Saving...';
            clipButton.disabled = true;

            try {
                const response = await chrome.runtime.sendMessage({
                    action: 'clip_page',
                    data: {
                        type: 'selection',
                        text: text,
                        title: document.title,
                        url: window.location.href,
                        userId: '356b3af3-1553-4bbc-844d-17b407b0de08' // Hardcoded for alpha
                    }
                });

                if (response.success) {
                    clipButton.textContent = 'Saved!';
                    setTimeout(() => {
                        if (clipButton) clipButton.remove();
                        clipButton = null;
                        window.getSelection().removeAllRanges();
                    }, 1500);
                } else {
                    clipButton.textContent = 'Error';
                    console.error(response.error);
                }
            } catch (err) {
                clipButton.textContent = 'Error';
                console.error(err);
            }
        });

        document.body.appendChild(clipButton);
    } else {
        // Hide button if no selection
        if (clipButton) {
            clipButton.remove();
            clipButton = null;
        }
    }
});

// Hide on click outside
document.addEventListener('mousedown', (e) => {
    if (clipButton && e.target !== clipButton) {
        clipButton.remove();
        clipButton = null;
    }
});
