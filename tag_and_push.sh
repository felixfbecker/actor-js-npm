#!/bin/sh

if test -n "$(git status --porcelain)"
then
    echo 'git repo is dirty, clean up before tagging'
    exit 1
fi

set -e  # exit if any command fails
set -x  # print commands

VERSION=$1

if test -z "$VERSION"
then
    echo 'You forgot to specify the new version'
    exit 1
fi

git tag -a $VERSION -m "$VERSION"
docker build -t dependencies/dep-actor-js-npm-github-pr:$VERSION .
docker push dependencies/dep-actor-js-npm-github-pr:$VERSION

git push && git push --tags
