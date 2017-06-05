#!/bin/sh
set -e
set -x

docker build -t actor-js-npm .

# create a new git repo for testing
rm -rf test/repo
cp -r test/repo_base/ test/repo/
cd test/repo
git init
git add .
git commit -m 'initial commit'
cd ../..

docker run \
    -e GITHUB_REPO_FULL_NAME=${GITHUB_REPO_FULL_NAME:-test} \
    -e GITHUB_API_TOKEN=${GITHUB_API_TOKEN:-test} \
    -e BUILD_NAME="build-0" \
    -e DEPENDENCIES="$(cat test/given_dependencies.json)" \
    -e SETTING_PR_BASE=${PR_BASE:-master} \
    -e DEPENDENCIES_ENV=${DEPENDENCIES_ENV:-test} \
    -v ${REPO_PATH:-"$(pwd)/test/repo/"}:/repo/ \
    actor-js-npm

# check that the modified file matches what we would expect
cd test/repo
git checkout react-15.5.4
diff ../expected_package_react.json package.json

git checkout redux-3.6.0
diff ../expected_package_redux.json package.json
cd ../..
