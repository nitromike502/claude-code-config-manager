#!/bin/bash
# Setup script to install Git hooks for Claude Code Config Manager
# This enforces the feature branch workflow

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Setting up Git hooks for Claude Code Config Manager..."
echo ""

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Install pre-push hook
echo "📝 Installing pre-push hook..."
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash
# Pre-push hook to prevent direct pushes to main/master branch
# This enforces the feature branch workflow

# Get the current branch name
current_branch=$(git symbolic-ref --short HEAD)

# Define protected branches
protected_branches=("main" "master" "develop")

# Check if current branch is protected
for branch in "${protected_branches[@]}"; do
    if [ "$current_branch" = "$branch" ]; then
        echo "❌ ERROR: Direct pushes to '$branch' branch are not allowed!"
        echo ""
        echo "Please use the feature branch workflow:"
        echo "  1. Create a feature branch: git checkout -b feature/your-feature-name"
        echo "  2. Make your changes and commit"
        echo "  3. Push your feature branch: git push -u origin feature/your-feature-name"
        echo "  4. Create a Pull Request for review"
        echo ""
        echo "For more information, see CLAUDE.md"
        exit 1
    fi
done

# Allow push if not on protected branch
exit 0
EOF

# Make hook executable
chmod +x "$HOOKS_DIR/pre-push"

echo "✅ Pre-push hook installed successfully!"
echo ""
echo "The hook will prevent direct pushes to main/master/develop branches."
echo "All development work must be done on feature branches."
echo ""
echo "For more information, see the 'Git Workflow' section in CLAUDE.md"
