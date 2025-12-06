import fetch from 'node-fetch';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    console.error('GROQ_API_KEY is missing');
    process.exit(1);
}

async function listModels() {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Available Models:');
        data.data.forEach((model: any) => {
            console.log(`- ${model.id}`);
        });
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
