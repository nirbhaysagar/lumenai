# Sentry Integration Verification Guide

**Last Updated:** November 27, 2025  
**Status:** ✅ Tested and Verified

This guide provides step-by-step instructions to verify Sentry error tracking across your entire application stack.

---

## Quick Start Checklist

- [ ] Sentry packages installed
- [ ] Environment variables configured in `.env.local`
- [ ] Dev server running (`npm run dev`)
- [ ] Workers running (`npm run start:workers`)
- [ ] Server error test passed
- [ ] Worker error test passed
- [ ] Client error test passed (optional)

---

## Prerequisites

### 1. Sentry Account Setup

1. **Sign up** at [sentry.io](https://sentry.io) (free tier available)
2. **Create a Project**:
   - Click "Create Project"
   - Platform: **Next.js**
   - Alert frequency: Choose based on preference
   - Project name: `lumen-ai` (or your preference)
3. **Get Your DSN**:
   - After project creation, copy the DSN
   - Format: `https://[key]@[org-id].ingest.sentry.io/[project-id]`
   - Example: `https://601144d1b4e40c62c15fe5d452782b07@o4510436320673792.ingest.us.sentry.io/4510436321394688`

---

## Setup Instructions

### Step 1: Install Sentry Packages

Run the installation script:

```bash
bash scripts/setup-sentry.sh
```

**Expected Output:**
```
Installing Sentry packages...
✅ Sentry packages installed successfully!
```

**Packages Installed:**
- `@sentry/node@10.27.0` - Server-side tracking
- `@sentry/tracing@7.120.4` - Performance monitoring
- `@sentry/react@10.27.0` - Client-side tracking

### Step 2: Configure Environment Variables

Add to your `.env.local` file:

```bash
# Server-side Sentry
SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"
SENTRY_ENV=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Client-side Sentry (use same DSN or create separate project)
NEXT_PUBLIC_SENTRY_DSN="https://your-key@your-org.ingest.sentry.io/your-project-id"
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Configuration Notes:**
- **Same DSN**: Use the same DSN for both server and client (recommended for simplicity)
- **Separate DSNs**: Create two Sentry projects for separate error tracking
- **Environment**: Use `development`, `staging`, or `production`
- **Sample Rate**: `0.1` = 10% of transactions tracked (reduces overhead in dev)

### Step 3: Restart Services

**Terminal 1 - Dev Server:**
```bash
npm run dev
```

**Expected Output:**
```
✓ Ready in 674ms
- Local:         http://localhost:3000
```

**Terminal 2 - Workers:**
```bash
npm run start:workers
```

**Expected Output:**
```
✅ Sentry worker initialized
🚀 Starting Embeddings Worker...
🚀 Starting Topicer Worker...
✅ All workers initialized and listening for jobs...
```

> **Important:** If you don't see "✅ Sentry worker initialized", check that `SENTRY_DSN` is set in `.env.local`

---

## Verification Tests

### Test 1: Server-Side Error Capture ✅

**What This Tests:** API route error tracking with automatic capture and flushing

**Steps:**

1. **Trigger the test endpoint:**
   ```bash
   curl http://localhost:3000/api/sentry-test
   ```

2. **Expected Terminal Output:**
   ```
   🧪 Sentry test endpoint called
   ```

3. **Expected Response:**
   ```json
   {
     "error": "Internal Server Error",
     "message": "Test error from Sentry test endpoint - this is intentional!"
   }
   ```
   Status: `500 Internal Server Error`

4. **Verify in Sentry Dashboard:**
   
   a. Go to your Sentry project → **Issues**
   
   b. Look for new issue: **"Test error from Sentry test endpoint - this is intentional!"**
   
   c. Click the issue and verify:
   
   | Field | Expected Value |
   |-------|----------------|
   | **Error Message** | "Test error from Sentry test endpoint - this is intentional!" |
   | **Environment** | `development` (or your configured env) |
   | **Tag: handler** | `api_route` |
   | **Stack Trace** | Shows `route.ts` file and line number |
   | **Request URL** | `http://localhost:3000/api/sentry-test` |
   | **Request Method** | `GET` |

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| No event in Sentry | Check `SENTRY_DSN` is set correctly in `.env.local` |
| Event delayed | Wait 30-60 seconds; Sentry may batch events |
| 404 error | Ensure dev server is running on port 3000 |
| No initialization log | Restart dev server after adding env vars |

---

### Test 2: Worker Error Capture ✅

**What This Tests:** Background job error tracking with worker context and tags

**Steps:**

1. **Ensure workers are running:**
   ```bash
   # Check Terminal 2 for worker output
   # Should see: "✅ All workers initialized and listening for jobs..."
   ```

2. **Trigger a worker error:**
   ```bash
   node scripts/trigger-worker-error.js
   ```

3. **Expected Script Output:**
   ```
   🧪 Triggering worker error for Sentry testing...
   ✅ Error test job enqueued: 7
   📊 Check your worker logs and Sentry dashboard for the error event.
   ```

4. **Expected Worker Terminal Output:**
   ```
   Processing chunk test-error-chunk-id for capture undefined
   Job 7 failed: Intentional worker error for Sentry testing (willFail flag detected)
   ```

5. **Verify in Sentry Dashboard:**
   
   a. Go to your Sentry project → **Issues**
   
   b. Look for new issue: **"Intentional worker error for Sentry testing (willFail flag detected)"**
   
   c. Click the issue and verify:
   
   | Field | Expected Value |
   |-------|----------------|
   | **Error Message** | "Intentional worker error for Sentry testing (willFail flag detected)" |
   | **Environment** | `development` |
   | **Tag: context** | `worker` |
   | **Tag: worker_type** | `bullmq` |
   | **Tag: worker** | `embeddings` |
   | **Tag: jobId** | `7` (or your job ID) |
   | **Extra: jobData** | Contains `willFail: true`, `chunkId`, etc. |
   | **Extra: attemptsMade** | `1` |
   | **Context: worker** | `{ type: 'bullmq', pid: <process-id> }` |
   | **Stack Trace** | Shows `embeddings.worker.ts` file |

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| No event in Sentry | Check workers terminal for "✅ Sentry worker initialized" |
| Job not processed | Ensure Redis is running and `REDIS_URL` is set |
| Wrong DSN error | Workers use `SENTRY_DSN`, not `NEXT_PUBLIC_SENTRY_DSN` |
| Module not found | Restart workers after code changes |

---

### Test 3: Client-Side Error Capture (Optional)

**What This Tests:** Browser error tracking with React error boundaries

**Steps:**

1. **Open your app in a browser:**
   ```
   http://localhost:3000
   ```

2. **Open Browser DevTools:**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: Press `F12`
   - Safari: Enable Developer menu, then `Cmd+Option+I`

3. **Go to Console tab**

4. **Manually throw an error:**
   ```javascript
   throw new Error("Test client error from browser console");
   ```

5. **Expected Console Output:**
   ```
   Uncaught Error: Test client error from browser console
   ```

6. **Verify in Sentry Dashboard:**
   
   a. Go to your Sentry project → **Issues**
   
   b. Look for new issue: **"Test client error from browser console"**
   
   c. Click the issue and verify:
   
   | Field | Expected Value |
   |-------|----------------|
   | **Error Message** | "Test client error from browser console" |
   | **Environment** | `development` |
   | **Browser** | Your browser name and version |
   | **OS** | Your operating system |
   | **URL** | `http://localhost:3000` |
   | **Stack Trace** | May show console origin |

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| No event in Sentry | Check browser console for "✅ Sentry client-side initialized" |
| Initialization error | Ensure `NEXT_PUBLIC_SENTRY_DSN` is set |
| No console log | Verify `src/app/layout.tsx` imports `@/lib/sentry.client` |
| CORS error | Check Sentry project settings allow your domain |

---

## Understanding Sentry Events

### Event Anatomy

Each error event in Sentry contains:

1. **Error Message & Type**
   - What went wrong
   - Error class (e.g., `Error`, `TypeError`)

2. **Stack Trace**
   - File paths and line numbers
   - Function call chain
   - Source code snippets (if source maps configured)

3. **Breadcrumbs**
   - Events leading up to the error
   - Example: "Processing embeddings job" → "Chunk fetch" → Error
   - Helps understand context

4. **Tags**
   - Filterable metadata
   - Examples: `worker: embeddings`, `handler: api_route`, `environment: development`

5. **Context**
   - Additional structured data
   - Request headers, job data, user info, etc.

6. **Environment**
   - Deployment environment (development, staging, production)

### Filtering and Searching

Use Sentry's search bar to filter events:

```
# All API route errors
handler:api_route

# All worker errors
context:worker

# Specific worker
worker:embeddings

# By environment
environment:production

# Combine filters
environment:development worker:embeddings
```

---

## Integration Points

### Where Sentry is Initialized

| Location | Purpose | Initialization |
|----------|---------|----------------|
| `src/app/layout.tsx` | Client-side | Imports `@/lib/sentry.client` |
| `src/workers/index.ts` | Workers | Inlined Sentry.init() before worker imports |
| API Routes | Server-side | Lazy-loaded via `withSentry()` wrapper |

### Using Sentry in Your Code

#### 1. API Routes

Wrap your route handlers with `withSentry()`:

```typescript
import { withSentry } from '@/lib/sentryNextWrapper';

export const GET = withSentry(async (request: Request) => {
  // Your code here
  // Errors automatically captured and flushed
});
```

#### 2. Workers

Import Sentry directly:

```typescript
import * as Sentry from '@sentry/node';

worker.on('failed', (job, err) => {
  Sentry.captureException(err, {
    tags: { worker: 'my-worker', jobId: job?.id },
    extra: { jobData: job?.data }
  });
});
```

#### 3. Helper Functions

Use safe helpers anywhere:

```typescript
import { captureException, addBreadcrumb, setUser } from '@/lib/sentryHelpers';

// Add context
addBreadcrumb('User action', { action: 'submit_form', formId: '123' });

// Set user info
setUser({ id: userId, email: userEmail });

// Capture errors
try {
  await riskyOperation();
} catch (error) {
  captureException(error, { userId, operation: 'riskyOperation' });
  throw error; // Re-throw if needed
}
```

---

## Configuration Reference

### Environment Variables

| Variable | Required | Scope | Default | Description |
|----------|----------|-------|---------|-------------|
| `SENTRY_DSN` | Yes | Server, Workers | - | Server-side DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | Client | - | Client-side DSN |
| `SENTRY_ENV` | No | All | `NODE_ENV` | Environment name |
| `SENTRY_TRACES_SAMPLE_RATE` | No | Server, Workers | `0.1` | Performance sampling (0.0-1.0) |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | No | Client | `0.1` | Client performance sampling |

### Sample Rates

| Environment | Recommended Sample Rate | Reasoning |
|-------------|------------------------|-----------|
| **Development** | `0.0` - `0.1` (0-10%) | Reduce noise, focus on errors |
| **Staging** | `0.5` (50%) | Balance between data and cost |
| **Production** | `0.5` - `1.0` (50-100%) | Maximum visibility |

### Data Scrubbing

Sensitive data is automatically scrubbed:

**Server (`sentry.server.ts`):**
- Removes `authorization` header
- Removes `cookie` header

**Client (`sentry.client.tsx`):**
- Filters breadcrumbs containing "password"

**Workers (`workers/index.ts`):**
- Adds worker context (type, PID)

**Customize** by editing the `beforeSend` hooks in each initializer.

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update `SENTRY_ENV` to `production`
- [ ] Increase `SENTRY_TRACES_SAMPLE_RATE` to `0.5` or `1.0`
- [ ] Configure separate Sentry projects for staging/production (optional)
- [ ] Set up Sentry alerts for critical errors
- [ ] Configure source maps for better stack traces
- [ ] Test error capture in staging environment
- [ ] Remove or disable test endpoints (`/api/sentry-test`)

### Source Maps (Optional)

For better stack traces in production:

1. Install Sentry webpack plugin:
   ```bash
   npm install --save-dev @sentry/webpack-plugin
   ```

2. Configure in `next.config.js`:
   ```javascript
   const { withSentryConfig } = require('@sentry/nextjs');
   
   module.exports = withSentryConfig(
     { /* your Next.js config */ },
     { /* Sentry config */ }
   );
   ```

3. Add auth token to `.env.local`:
   ```bash
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

### Alerts Configuration

Set up alerts in Sentry dashboard:

1. Go to **Alerts** → **Create Alert**
2. Choose trigger: "Errors", "Performance", etc.
3. Set conditions: "First seen", "Frequency", etc.
4. Configure notifications: Email, Slack, PagerDuty, etc.

**Recommended Alerts:**
- New issue in production
- Error rate exceeds threshold
- Performance degradation

---

## Troubleshooting

### Common Issues

#### 1. "Sentry DSN not configured" Warning

**Symptoms:**
```
⚠️  Sentry DSN not configured. Skipping worker Sentry initialization.
```

**Cause:** Missing `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` in `.env.local`

**Solution:**
1. Add DSN to `.env.local`
2. Restart services:
   ```bash
   # Kill and restart
   pkill -f "next dev"
   pkill -f "start:workers"
   npm run dev
   npm run start:workers
   ```

#### 2. Events Not Appearing in Sentry

**Possible Causes:**

| Cause | Check | Fix |
|-------|-------|-----|
| Wrong DSN | Verify DSN matches Sentry project | Copy correct DSN from Sentry dashboard |
| Network blocked | `curl https://sentry.io` | Check firewall/proxy settings |
| Wrong environment | Check Sentry project settings | Ensure environment filter includes your env |
| Flush timeout | Serverless functions timing out | Increase timeout in `withSentry` wrapper |
| Not initialized | Check console logs | Look for "✅ Sentry initialized" messages |

**Debug Steps:**
```bash
# 1. Check env vars are loaded
echo $SENTRY_DSN
echo $NEXT_PUBLIC_SENTRY_DSN

# 2. Test network connectivity
curl -I https://sentry.io

# 3. Check Sentry project status
# Go to sentry.io → Project Settings → Client Keys
# Ensure DSN is active

# 4. Enable debug mode (temporarily)
# Add to Sentry.init():
debug: true,
```

#### 3. Duplicate Events

**Symptoms:** Same error appears multiple times

**Causes:**
- Hot reload in development
- Multiple Sentry initializations
- Retry logic without deduplication

**Solutions:**
- Restart dev server to clear state
- Idempotent initialization guards (already implemented)
- Use Sentry's built-in deduplication (automatic)

#### 4. Module Resolution Errors (Workers)

**Symptoms:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './sentry.worker'
```

**Cause:** ts-node ESM mode requires specific import patterns

**Solution:** Already fixed in implementation:
- Sentry initialization inlined in `src/workers/index.ts`
- Worker imports use `.ts` extensions
- `tsconfig.workers.json` uses `moduleResolution: "node"`

#### 5. TypeScript Lint Errors

**Symptoms:**
```
An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
```

**Cause:** TypeScript strict mode

**Note:** These are warnings only and don't affect runtime. The configuration is correct for ts-node ESM mode.

**To suppress:** Add to `tsconfig.workers.json`:
```json
{
  "compilerOptions": {
    "allowImportingTsExtensions": true
  }
}
```

---

## Performance Considerations

### Impact on Application

| Component | Overhead | Mitigation |
|-----------|----------|------------|
| **Server** | ~1-5ms per request | Use low sample rate (0.1) in dev |
| **Client** | ~10-20KB bundle size | Lazy load Sentry |
| **Workers** | ~1-2ms per job | Minimal, already async |

### Best Practices

1. **Sample Rate**
   - Development: 0.0 - 0.1 (0-10%)
   - Production: 0.5 - 1.0 (50-100%)

2. **Ignored Errors**
   - Filter out non-actionable errors
   - Example: `ResizeObserver loop limit exceeded`
   - Configure in `beforeSend` hooks

3. **Breadcrumb Limits**
   - Sentry keeps last 100 breadcrumbs
   - Don't add breadcrumbs in tight loops

4. **Event Flushing**
   - Serverless: Always flush before function ends
   - Long-running: Events sent automatically

---

## Next Steps

### After Verification

1. **Remove Test Files** (Optional):
   ```bash
   rm src/app/api/sentry-test/route.ts
   rm scripts/trigger-worker-error.js
   ```

2. **Integrate with Existing Code**:
   - Add `withSentry()` to API routes
   - Use `sentryHelpers` in application logic
   - Add breadcrumbs for debugging context

3. **Configure Alerts**:
   - Set up Slack/email notifications
   - Define error rate thresholds
   - Create on-call schedules

4. **Monitor Performance**:
   - Review transaction traces
   - Identify slow endpoints
   - Optimize based on data

### Additional Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **BullMQ + Sentry**: https://docs.sentry.io/platforms/node/
- **Performance Monitoring**: https://docs.sentry.io/product/performance/
- **Alerts Guide**: https://docs.sentry.io/product/alerts/

---

## Verification Checklist

Use this checklist to confirm your setup:

- [ ] ✅ Sentry packages installed (`@sentry/node`, `@sentry/react`, `@sentry/tracing`)
- [ ] ✅ Environment variables configured in `.env.local`
- [ ] ✅ Dev server shows "Ready" message
- [ ] ✅ Workers show "✅ Sentry worker initialized"
- [ ] ✅ Server test endpoint returns 500 error
- [ ] ✅ Server error appears in Sentry dashboard with correct tags
- [ ] ✅ Worker test script enqueues job successfully
- [ ] ✅ Worker error appears in Sentry dashboard with worker tags
- [ ] ✅ Client error test (optional) captures browser errors
- [ ] ✅ All events show correct environment tag
- [ ] ✅ Stack traces are readable and accurate
- [ ] ✅ Breadcrumbs provide useful context

---

**Verification Complete!** 🎉

Your Sentry integration is now active and capturing errors across:
- ✅ Next.js API routes (server-side)
- ✅ React components (client-side)
- ✅ BullMQ workers (background jobs)

**Questions or Issues?**
- Check the troubleshooting section above
- Review Sentry documentation
- Contact your team or create a GitHub issue
