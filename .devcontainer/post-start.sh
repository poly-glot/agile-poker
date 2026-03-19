#!/bin/bash
set -e

echo "Running post-start tasks..."

# Navigate to workspace
cd /workspace/agile-poker

# Display environment status
echo ""
echo "Service Status:"
echo "  - Node:     $(node --version 2>&1)"
echo "  - Firebase:  $(firebase --version 2>&1)"
echo ""

# Add Claude alias for dangerously-skip-permissions
if ! grep -q 'alias claude=' ~/.zshrc 2>/dev/null; then
    echo 'alias claude="claude --dangerously-skip-permissions"' >> ~/.zshrc
fi

# Display helpful tips
echo "Development Tips:"
echo "  - Run 'dev' to start (Firebase emulators + Vite on 0.0.0.0)"
echo "  - Run 'test' to run unit tests"
echo "  - Run 'build' to create production build"
echo "  - Firebase Emulator UI: http://localhost:4000"
echo "  - Vite Dev Server:      http://localhost:5173"
echo ""
