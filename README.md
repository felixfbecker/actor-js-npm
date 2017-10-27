# actor-js-npm
[![Docker](https://img.shields.io/badge/dockerhub-actor--js--npm-22B8EB.svg)](https://hub.docker.com/r/dependencies/actor-js-npm/)
[![GitHub release](https://img.shields.io/github/release/dependencies-io/actor-js-npm.svg)](https://github.com/dependencies-io/actor-js-npm/releases)
[![Build Status](https://travis-ci.org/dependencies-io/actor-js-npm.svg?branch=master)](https://travis-ci.org/dependencies-io/actor-js-npm)
[![license](https://img.shields.io/github/license/dependencies-io/actor-js-npm.svg)](https://github.com/dependencies-io/actor-js-npm/blob/master/LICENSE)

A [dependencies.io](https://www.dependencies.io)
[actor](https://www.dependencies.io/docs/actors/) for updating `package.json` dependencies and creating a pull request on GitHub with those changes. Also
updates `package-lock.json` and `yarn.lock` files if present.

## Usage

### dependencies.yml

```yaml
collectors:
- ...
  actors:
  - type: js-npm
    versions: "L.Y.Y"
    settings:

      # optional contents to put in ~/.npmrc
      npmrc: |
        registry=https://skimdb.npmjs.com/registry

      # an optional prefix to add to all commit messages, be sure to add a space at the end if you want one
      commit_message_prefix: "chore: "

      # false by default, set to true if you want all dependency updates in a single PR
      batch_mode: false

      # github options
      github_labels:  # list of label names
      - bug
      github_assignees:  # list of usernames
      - davegaeddert
      github_milestone: 3  # milestone number
      github_base_branch: develop  # branch to make PR against (if something other than your default branch)

      # gitlab options
      gitlab_assignee_id: 1  # assignee user ID
      gitlab_labels:  # labels for MR as a list of strings
      - dependencies
      - update
      gitlab_milestone_id: 1  # the ID of a milestone
      gitlab_target_project_id: 1  # The target project (numeric id)
      gitlab_remove_source_branch: true  # flag indicating if a merge request should remove the source branch when merging
      gitlab_target_branch: develop  # branch to make PR against (if something other than your default branch)
```

### Works well with

- [js-npm collector](https://www.dependencies.io/docs/collectors/js-npm/) ([GitHub repo](https://github.com/dependencies-io/collector-js-npm/))

## Resources

- https://devcenter.heroku.com/articles/node-best-practices

## Support

Any questions or issues with this specific actor should be discussed in [GitHub
issues](https://github.com/dependencies-io/actor-js-npm/issues). If there is
private information which needs to be shared then you can instead use the
[dependencies.io support](https://app.dependencies.io/support).
