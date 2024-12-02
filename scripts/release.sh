#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure working directory is clean
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Error: Working directory is not clean${NC}"
  exit 1
fi

# Get current version from package.json
current_version=$(node -p "require('./package.json').version")
echo -e "${BLUE}Current version: ${current_version}${NC}"

# Prompt for version bump type
echo -e "${BLUE}Select version bump type:${NC}"
echo "1) patch (x.x.X)"
echo "2) minor (x.X.0)"
echo "3) major (X.0.0)"
read -p "Enter choice [1-3]: " bump_type

case $bump_type in
  1) version_type="patch";;
  2) version_type="minor";;
  3) version_type="major";;
  *) echo -e "${RED}Invalid choice${NC}"; exit 1;;
esac

# Run tests
echo -e "${BLUE}Running tests...${NC}"
npm test
if [ $? -ne 0 ]; then
  echo -e "${RED}Tests failed${NC}"
  exit 1
fi

# Bump version
echo -e "${BLUE}Bumping ${version_type} version...${NC}"
npm version $version_type

# Get new version
new_version=$(node -p "require('./package.json').version")

# Push changes
echo -e "${BLUE}Pushing changes...${NC}"
git push && git push --tags

echo -e "${GREEN}Successfully released version ${new_version}${NC}"