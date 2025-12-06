import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const USER_ID = '356b3af3-1553-4bbc-844d-17b407b0de08';

async function debugApi() {
    console.log('🔍 Debugging API Responses...');

    // Check Graph
    try {
        const graphRes = await fetch(`${BASE_URL}/api/graph?userId=${USER_ID}`);
        const graphData = await graphRes.json();
        console.log('\n🕸️ Graph API Keys:', Object.keys(graphData));
        if (graphData.nodes) console.log('Nodes count:', graphData.nodes.length);
        if (graphData.links) console.log('Links count:', graphData.links.length);
        else console.log('❌ Links property is missing!');
    } catch (e) {
        console.error('❌ Graph API Failed:', e);
    }

    // Check Memories
    try {
        const memoriesRes = await fetch(`${BASE_URL}/api/memories?userId=${USER_ID}&limit=5`);
        const memoriesData = await memoriesRes.json();
        console.log('\n🧠 Memories API Keys:', Object.keys(memoriesData));
        if (memoriesData.memories) {
            console.log('Memories count:', memoriesData.memories.length);
            if (memoriesData.memories.length > 0) {
                console.log('First memory keys:', Object.keys(memoriesData.memories[0]));
                console.log('First memory content:', memoriesData.memories[0].content?.substring(0, 50));
            }
        }
    } catch (e) {
        console.error('❌ Memories API Failed:', e);
    }
}

debugApi();
