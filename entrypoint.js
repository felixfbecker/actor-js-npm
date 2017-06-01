const path = require('path')
const shell = require('shelljs')
const request = require('request')

const REPO_PATH = '/repo'
const TESTING = (process.env.DEPENDENCIES_ENV || 'production') == 'test'
const GITHUB_REPO_FULL_NAME = process.env.GITHUB_REPO_FULL_NAME
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN
const PR_BASE = process.env.GIT_BRANCH
const GIT_SHA = process.env.GIT_SHA
const dependencies = JSON.parse(process.env.DEPENDENCIES)

shell.set('-e')  // any failing shell commands will fail

dependencies.forEach(function(dependency) {
  console.log(dependency)

  const name = dependency.name
  const installed = dependency.installed.version
  const dependencyPath = path.join(REPO_PATH, dependency.path)
  const packageJsonPath = path.join(dependencyPath, 'package.json')
  const packageJson = require(packageJsonPath)
  const isDevDependency = packageJson.hasOwnProperty('devDependencies') && packageJson.devDependencies.hasOwnProperty(name)

  dependency.available.forEach(function(available) {

    const version = available.version
    const branchName = `${name}-${version}`
    const msg = `Update ${name} from ${installed} to ${version}`
    const prBody = `${name} has been updated to ${version} by dependencies.io`

    shell.rm('-rf', 'node_modules')

    shell.exec(`git checkout ${GIT_SHA}`)

    shell.exec(`git checkout -b ${branchName}`)

    const shrinkwrap = false

    if (shrinkwrap) {
      // if shrinkwrap, then really have to install everything and run shrinkwrap?
      shell.exec('npm install --quiet')

      const installOpts = isDevDependency ? '--save-dev' : ''
      shell.exec(`npm install ${name}@${version} --quiet --save --save-exact ${installOpts}`)
    } else {
      // if not shrinkwrap, can just update entry in package.json
      // how to just write to file while preserving order? like npm does, but without
      // actual download/install...
      const installOpts = isDevDependency ? '--save-dev' : ''
      shell.exec(`npm install ${name}@${version} --quiet --save --save-exact ${installOpts}`)
    }

    shell.exec(`git add ${packageJsonPath}`)
    shell.exec(`git commit -m "${msg}"`)

    if (!TESTING) {
      shell.exec(`git push --set-upstream origin ${branchName}`)
      const requestOptions = {
        method: 'POST',
        json: {
          'title': msg,
          'head': branchName,
          'base': PR_BASE,
          'body': prBody,
        },
        url: `https://api.github.com/repos/${GITHUB_REPO_FULL_NAME}/pulls`,
        headers: {
          'User-Agent': 'dependencies.io dep-actor-js-npm-github-pr',
          'Authorization': `token ${GITHUB_API_TOKEN}`
        }
      }
      request(requestOptions).on('response', function(response) {
        // console.log(response)
      })
    }
  })

  dependencyJSON = JSON.stringify(dependency)
  console.log(`BEGIN_DEPENDENCIES_SCHEMA_OUTPUT>${dependencyJSON}<END_DEPENDENCIES_SCHEMA_OUTPUT`)

})
