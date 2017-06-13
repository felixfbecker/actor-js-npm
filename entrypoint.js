const path = require('path')
const shell = require('shelljs')
const request = require('request')
const fs = require('fs')

const REPO_PATH = '/repo'
const TESTING = (process.env.DEPENDENCIES_ENV || 'production') == 'test'
const GITHUB_REPO_FULL_NAME = process.env.GITHUB_REPO_FULL_NAME
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN
const PR_BASE = process.env.GIT_BRANCH
const BUILD_NUMBER = process.env.BUILD_NUMBER
const GIT_SHA = process.env.GIT_SHA
const dependencies = JSON.parse(process.env.DEPENDENCIES)

shell.set('-e')  // any failing shell commands will fail

dependencies.forEach(function(dependency) {
  console.log(dependency)

  const name = dependency.name
  const installed = dependency.installed.version
  const dependencyPath = path.join(REPO_PATH, dependency.path)

  const yarnLockPath = path.join(dependencyPath, 'yarn.lock')
  const hasYarnLockFile = fs.existsSync(yarnLockPath)

  const packageLockJsonPath = path.join(dependencyPath, 'package-lock.json')
  const hasPackageLockFile = fs.existsSync(packageLockJsonPath)

  const packageJsonPath = path.join(dependencyPath, 'package.json')
  const packageJson = require(packageJsonPath)
  const isDevDependency = packageJson.hasOwnProperty('devDependencies') && packageJson.devDependencies.hasOwnProperty(name)

  const version = dependency.available[0].version
  const branchName = `${name}-${version}-#${BUILD_NUMBER}`
  const msg = `Update ${name} from ${installed} to ${version}`
  const prBody = `${name} has been updated to ${version} by dependencies.io`

  shell.rm('-rf', 'node_modules')

  shell.exec(`git checkout ${GIT_SHA}`)

  shell.exec(`git checkout -b ${branchName}`)

  if (hasYarnLockFile) {
    shell.exec(`yarn upgrade ${name}@${version}`)
    shell.exec(`git add ${packageJsonPath} ${yarnLockPath}`)
  }
  else if (hasPackageLockFile) {
    shell.exec('npm install --quiet')
    shell.exec(`npm install ${name}@${version} --quiet`)
    shell.exec(`git add ${packageJsonPath} ${packageLockJsonPath}`)
  } else {
    const installOpts = isDevDependency ? '--save-dev' : ''
    shell.exec('npm install --quiet')
    shell.exec(`npm install ${name}@${version} --quiet --save --save-exact ${installOpts}`)
    shell.exec(`rm ${packageLockJsonPath}`)
    shell.exec(`git add ${packageJsonPath}`)
  }

  shell.exec(`git commit -m "${msg}"`)

  // fail if there are other unchanged files
  if (shell.exec('git status --porcelain').stdout.trim() != "") {
      throw 'Git repo is dirty, there are changes that aren\'t accounted for\n' + shell.exec('git status').stdout
  }

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
        'User-Agent': 'dependencies.io actor-js-npm',
        'Authorization': `token ${GITHUB_API_TOKEN}`
      }
    }
    request(requestOptions).on('response', function(response) {
      // console.log(response)
    })
  }

  dependencyJSON = JSON.stringify(dependency)
  console.log(`BEGIN_DEPENDENCIES_SCHEMA_OUTPUT>${dependencyJSON}<END_DEPENDENCIES_SCHEMA_OUTPUT`)

})
