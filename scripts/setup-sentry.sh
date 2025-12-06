#!/bin/bash

echo "🔧 Installing Sentry packages..."

npm install @sentry/node @sentry/tracing @sentry/react --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ Sentry packages installed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Add SENTRY_DSN to your .env.local file"
    echo "2. Set SENTRY_ENV (e.g., development, staging, production)"
    echo "3. Configure SENTRY_TRACES_SAMPLE_RATE (0.0 to 1.0)"
    echo ""
    echo "See .env.example for all Sentry environment variables."
else
    echo "❌ Failed to install Sentry packages"
    exit 1
fi
