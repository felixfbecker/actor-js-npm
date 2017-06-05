# actor-js-npm

A [dependencies.io](https://dependencies.io) actor for updating `package.json` dependencies and creating a
pull request on GitHub with those changes.

## Development

The default `test/run.sh` uses creates a dummy repo, and does not test the `git push` or GitHub
PR steps.

Run with
```sh
$ ./test/run.sh
```

To run a live test against a GitHub repo and and create real branches/pulls:
TODO make this work
```sh
$ DEPENDENCIES_ENV=nottest GITHUB_REPO_FULL_NAME=<real repo> GITHUB_API_TOKEN=<real token> REPO_PATH=<path to real local repo> ./test/run.sh
```

Use a repo that you have access to, preferably one just for testing. You'll also
need a valid GitHub API token, which is most easily done by creating a
[personal access token](https://github.com/settings/tokens).
