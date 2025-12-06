# Lumen AI API Documentation

This document outlines the key API endpoints available in the Lumen AI application.

## Base URL
All API endpoints are prefixed with `/api`.

## Authentication
Most endpoints require a valid user session. The `userId` is currently passed as a query parameter or in the request body for some endpoints during the alpha phase, but will transition to strict session-based auth.

---

## 1. Captures
Manage raw data inputs (text, files, URLs).

### `GET /api/captures`
Retrieve a list of captures for a user.

**Parameters:**
- `userId` (required): UUID of the user.
- `limit` (optional): Number of items to return (default: 50).

**Response:**
```json
{
  "captures": [
    {
      "id": "uuid",
      "type": "text|url|file",
      "content": "...",
      "created_at": "timestamp",
      "chunk_count": 5
    }
  ]
}
```

---

## 2. Memory Directives
Manage rules for how the system handles specific memories.

### `GET /api/memory/directives`
Retrieve active directives.

**Parameters:**
- `userId` (required): UUID of the user.
- `isActive` (optional): Filter by active status (`true`/`false`).

**Response:**
```json
{
  "directives": [
    {
      "id": "uuid",
      "target_type": "capture|context",
      "action": "surface|archive",
      "priority": "high"
    }
  ]
}
```

### `POST /api/memory/directives`
Create a new memory directive.

**Body:**
```json
{
  "userId": "uuid",
  "targetType": "capture",
  "targetId": "uuid",
  "triggerType": "time|topic",
  "triggerValue": "value",
  "action": "surface",
  "priority": "medium"
}
```

---

## 3. System Stats
Retrieve real-time metrics for the dashboard.

### `GET /api/stats`
Get system health, memory counts, and knowledge graph metrics.

**Parameters:**
- `userId` (required): UUID of the user.

**Response:**
```json
{
  "activeContexts": 3,
  "queuedJobs": 0,
  "memoryCounts": {
    "raw": 100,
    "canonical": 50,
    "abstract": 10,
    "concepts": 25
  },
  "knowledgeGraph": [
    { "subject": "Volume", "A": 120, "fullMark": 150 },
    { "subject": "Connectivity", "A": 90, "fullMark": 150 }
    // ... other metrics
  ],
  "systemHealth": "operational"
}
```

---

## 4. Recall Review
Manage spaced repetition reviews.

### `GET /api/recall/review`
Fetch items due for review.

**Parameters:**
- `userId` (required): UUID of the user.

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "content": "Question or content to review",
      "metadata": { "note": "Answer/Context" }
    }
  ]
}
```

### `POST /api/recall/review`
Submit a review result.

**Body:**
```json
{
  "itemId": "uuid",
  "quality": 0-5 // 0=Blackout, 5=Perfect
}
```
