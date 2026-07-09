#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

branch="$(git branch --show-current)"
if [[ -z "$branch" ]]; then
  echo "No current branch found. Aborting."
  exit 1
fi

message="${1:-Update dashboard portfolio}"

echo "Repository: $repo_root"
echo "Branch: $branch"
echo

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Changes detected:"
  git status --short
  echo
  git add -A
  git commit -m "$message"
else
  echo "No local changes to commit."
fi

echo
echo "Pushing to origin/$branch..."
git push origin "$branch"
echo "Push complete."
