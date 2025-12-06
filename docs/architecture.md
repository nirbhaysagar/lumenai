# Lumen AI System Architecture

Lumen AI is a memory augmentation platform designed to ingest, process, and retrieve user information.

## High-Level Architecture

The system consists of three main layers:
1.  **Frontend (Next.js)**: The user interface for capturing data, viewing the dashboard, and managing memories.
2.  **Backend (Next.js API Routes)**: Handles data ingestion, retrieval, and interacts with the database.
3.  **Processing Layer (BullMQ Workers)**: Asynchronous workers for heavy lifting (embedding, summarization, graph building).
4.  **Data Layer (Supabase)**: Stores relational data, vector embeddings (`pgvector`), and the knowledge graph.

## Component Diagram

```mermaid
graph TD
    User[User] -->|Interacts| UI[Next.js Frontend]
    
    subgraph "Application Layer"
        UI -->|API Calls| API[Next.js API Routes]
        API -->|Read/Write| DB[(Supabase DB)]
        API -->|Enqueue Jobs| Queue[Redis / BullMQ]
    end
    
    subgraph "Processing Layer"
        Queue -->|Consume| Worker1[Embeddings Worker]
        Queue -->|Consume| Worker2[Summarization Worker]
        Queue -->|Consume| Worker3[Graph Worker]
        
        Worker1 -->|Save Vectors| DB
        Worker2 -->|Save Summary| DB
        Worker3 -->|Update Graph| DB
        
        Worker1 -->|Call| LLM[LLM Provider (Groq/OpenAI)]
        Worker2 -->|Call| LLM
        Worker3 -->|Call| LLM
    end
    
    subgraph "Data Layer"
        DB -->|pgvector| Vectors[Vector Store]
        DB -->|Relational| Tables[Users, Captures, Chunks]
        DB -->|Graph| Graph[Concepts, Relations]
    end
```

## Data Flow

1.  **Ingestion**:
    - User inputs text/file via `UniversalInput`.
    - API saves raw capture to `captures` table.
    - API enqueues a job to `processing-queue`.

2.  **Processing**:
    - **Chunking**: Raw text is split into chunks.
    - **Embedding**: Chunks are converted to vectors via LLM and stored in `chunk_vectors`.
    - **Graph Extraction**: Key concepts and relations are extracted and stored in `concepts` and `concept_relations`.

3.  **Retrieval (RAG)**:
    - User asks a question.
    - System converts query to vector.
    - Performs similarity search on `chunk_vectors`.
    - Retrieves relevant chunks and feeds them to LLM for answer generation.

4.  **Knowledge Graph**:
    - The `KnowledgeRadar` component visualizes the health of the graph by aggregating metrics from the `concepts` and `concept_relations` tables.
