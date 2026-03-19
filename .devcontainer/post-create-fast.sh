#!/bin/bash
set -e

echo "Running FAST post-create setup for Agile Poker development..."

# ============================================================
# Fix volume mount ownership (.cache is created as root by Docker volume mounts)
# ============================================================
echo "Fixing directory ownership for volume mounts..."
sudo chown -R "$(id -u):$(id -g)" ~/.cache 2>/dev/null || true

# ============================================================
# Node.js and NPM setup
# ============================================================
echo "Configuring NPM..."
mkdir -p ~/.npm
sudo chown -R "$(id -u):$(id -g)" ~/.npm
npm config set cache ~/.npm --global
npm config set update-notifier false --global

# ============================================================
# Git configuration
# ============================================================
echo "Configuring Git..."
git config --global --add safe.directory /workspace/agile-poker
git config --global --add safe.directory /workspace
git config --global init.defaultBranch main

# Helpful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'

# ============================================================
# Claude CLI configuration
# ============================================================
echo "Configuring Claude CLI..."

# Add claude alias for dangerously-skip-permissions
if [ -f ~/.zshrc ]; then
    if ! grep -q 'alias claude=' ~/.zshrc 2>/dev/null; then
        echo 'alias claude="claude --dangerously-skip-permissions"' >> ~/.zshrc
    fi
fi

# Make bash exec into zsh for interactive sessions
if [ -f ~/.bashrc ]; then
    if ! grep -q 'exec zsh' ~/.bashrc 2>/dev/null; then
        echo '[ -t 1 ] && exec zsh' >> ~/.bashrc
    fi
fi

# ============================================================
# Project dependencies (ROOT ONLY)
# ============================================================
echo "Installing project dependencies..."
cd /workspace/agile-poker

# Install root dependencies only
if [ -f "package-lock.json" ]; then
    echo "  → Running npm ci..."
    npm ci --no-audit --no-fund --prefer-offline 2>&1 | tail -n 2
else
    echo "  → Running npm install..."
    npm install --no-audit --no-fund --prefer-offline 2>&1 | tail -n 2
fi

# ============================================================
# PATH and aliases
# ============================================================
echo "Configuring shell..."

cat >> ~/.zshrc <<'EOF'

# ============================================================
# Agile Poker Aliases
# ============================================================

# Development shortcuts
alias dev='npm start'
alias build='npm run build'
alias test='npm test'
alias test:watch='npm run test:watch'
alias test:coverage='npm run test:coverage'
alias lint='npm run lint:js && npm run lint:css'

# Firebase shortcuts
alias fb='firebase'
alias fb-emulators='firebase emulators:start --project demo-agile-poker'
alias fb-deploy='firebase deploy'
alias fb-deploy-hosting='firebase deploy --only hosting'
alias fb-deploy-functions='firebase deploy --only functions'
alias fb-deploy-rules='firebase deploy --only database'

# Vite shortcuts
alias vite-dev='npx vite --host 0.0.0.0'
alias vite-build='npx vite build'
alias vite-preview='npx vite preview --host 0.0.0.0'

# Docker shortcuts
alias dc='docker compose'
alias dcup='docker compose up -d'
alias dcdown='docker compose down'
alias dclogs='docker compose logs -f'

# Cypress shortcuts
alias cy-open='npx cypress open'
alias cy-run='npx cypress run'

# Setup helpers (run these on-demand)
alias setup-firebase='npm install -g firebase-tools'
alias setup-functions='cd functions && npm install && cd ..'
alias setup-playwright='npx playwright install chromium --with-deps'

EOF

# ============================================================
# Done!
# ============================================================
echo ""
echo "✓ Fast setup complete!"
echo ""
echo "Environment Information:"
echo "  - Node:     $(node --version 2>&1)"
echo "  - NPM:      $(npm --version 2>&1)"
echo ""
echo "On-demand installations (run when needed):"
echo "  - Firebase CLI:        setup-firebase"
echo "  - Functions deps:      setup-functions"
echo "  - Playwright:          setup-playwright"
echo ""
echo "Quick Start:"
echo "  - Run app:        dev"
echo "  - Run tests:      test"
echo "  - Build:          build"
echo ""
