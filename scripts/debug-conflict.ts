console.log('Start');
import('bullmq').then(() => console.log('bullmq imported'));
import('../src/lib/embeddings').then(() => console.log('embeddings imported'));
