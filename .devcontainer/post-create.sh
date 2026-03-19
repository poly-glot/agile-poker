#!/bin/bash
set -e

echo "Running post-create setup for Agile Poker development..."

# ============================================================
# Fix volume mount ownership (.cache is created as root by Docker volume mounts)
# ============================================================
echo "Fixing directory ownership for volume mounts..."
sudo chown -R "$(id -u):$(id -g)" ~/.cache 2>/dev/null || true

# ============================================================
# System packages
# ============================================================
echo "Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    jq \
    htop \
    tree \
    > /dev/null 2>&1

# ============================================================
# Node.js and NPM setup
# ============================================================
echo "Configuring NPM..."
mkdir -p ~/.npm
sudo chown -R "$(id -u):$(id -g)" ~/.npm
npm config set cache ~/.npm --global
npm config set update-notifier false --global

# ============================================================
# Firebase CLI
# ============================================================
echo "Installing Firebase CLI..."
npm install -g firebase-tools > /dev/null 2>&1

# ============================================================
# GCloud setup
# ============================================================
if command -v gcloud &> /dev/null; then
    echo "Configuring Google Cloud CLI..."
    gcloud auth configure-docker europe-docker.pkg.dev --quiet 2>/dev/null || true
fi

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
# Git configuration
# ============================================================
echo "Configuring Git..."
git config --global --add safe.directory /workspace/agile-poker
git config --global --add safe.directory /workspace

# Set default branch
git config --global init.defaultBranch main

# Helpful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'

# ============================================================
# Project dependencies
# ============================================================
echo "Installing project dependencies..."
cd /workspace/agile-poker

# Install root dependencies
npm ci > /dev/null 2>&1 || npm install > /dev/null 2>&1

# Install functions dependencies
if [ -d "functions" ]; then
    echo "Installing Firebase Functions dependencies..."
    cd functions
    npm ci > /dev/null 2>&1 || npm install > /dev/null 2>&1
    cd /workspace/agile-poker
fi

# ============================================================
# Playwright setup
# ============================================================
echo "Installing Playwright browsers..."
npx playwright install --with-deps chromium > /dev/null 2>&1 || true

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

EOF

# ============================================================
# Verify installations
# ============================================================
echo ""
echo "Post-create setup complete!"
echo ""
echo "Environment Information:"
echo "  - Node:     $(node --version 2>&1)"
echo "  - NPM:      $(npm --version 2>&1)"
echo "  - Firebase:  $(firebase --version 2>&1)"
echo "  - Java:      $(java -version 2>&1 | head -n 1)"
echo ""
echo "Quick Start:"
echo "  - Run app:        dev (starts Firebase emulators + Vite)"
echo "  - Run tests:      test"
echo "  - Build:          build"
echo "  - Firebase UI:    http://localhost:4000"
echo ""
