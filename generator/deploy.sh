#!/bin/bash

setup_git() {
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis CI"
}

checkout_current_branch() {
  git checkout $TRAVIS_BRANCH
}

erase_existing_docs() {
  rm -rf ../rdfs_*
  mkdir -p ../rdfs_classes
  mkdir -p ../rdfs_properties
}

commit_generated_files() {
  git add ../rdfs_*
  git add ../ns/oa.jsonld
  git add ../ns/index.md
  git status
  git commit --message "Updating auto-generated namespace documentation: $TRAVIS_BUILD_NUMBER [ci skip]"
}

push_files() {
  git remote add origin-branch https://${GH_TOKEN}@github.com/openactive/openactive.github.io.git > /dev/null 2>&1
  git push --quiet --set-upstream origin-branch $TRAVIS_BRANCH
}

echo "Git version:"
git --version

echo "Setup Git:"
setup_git

echo "Checkout master:"
checkout_current_branch

echo "Erase existing documentation..."
erase_existing_docs

echo "npm install:"
npm install
npm install @openactive/data-models@latest
npm ls @openactive/data-models

echo "Generating data model documentation..."
npm run start

echo "Commit Generated Files:"
commit_generated_files

echo "Push Files:"
push_files
