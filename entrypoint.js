const path = require('path')
const shell = require('shelljs')
const shellQuote = require('shell-quote')
const request = require('request')
const fs = require('fs')

const REPO_PATH = '/repo'
const TESTING = (process.env.DEPENDENCIES_ENV || 'production') == 'test'
const GIT_HOST = process.env.GIT_HOST
const PR_BASE = process.env.GIT_BRANCH
const ACTOR_ID = process.env.ACTOR_ID
const GIT_SHA = process.env.GIT_SHA
const dependencies = JSON.parse(process.env.DEPENDENCIES)['dependencies']

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
  const branchName = `${name}-${version}-${ACTOR_ID}`
  const msg = `Update ${name} from ${installed} to ${version}`

  let prBody = `${name} has been updated to ${version} by dependencies.io`
  dependency.available.forEach(function(available) {
      const content = available.hasOwnProperty('content') ? available.content : '_No content found._'
      prBody += `\n\n## ${available.version}\n\n${content}`
  })

  shell.rm('-rf', path.join(dependencyPath, 'node_modules'))

  shell.exec(`git checkout ${GIT_SHA}`)

  shell.exec(`git checkout -b ${branchName}`)

  if (hasYarnLockFile) {
    shell.exec(`cd ${dependencyPath} && yarn upgrade ${name}@${version}`)
    shell.exec(`git add ${packageJsonPath} ${yarnLockPath}`)
  }
  else if (hasPackageLockFile) {
    shell.exec(`cd ${dependencyPath} && npm install --quiet`)
    shell.exec(`cd ${dependencyPath} && npm install ${name}@${version} --quiet`)
    shell.exec(`git add ${packageJsonPath} ${packageLockJsonPath}`)
  } else {
    const installOpts = isDevDependency ? '--save-dev' : ''
    shell.exec(`cd ${dependencyPath} && npm install --quiet`)
    shell.exec(`cd ${dependencyPath} && npm install ${name}@${version} --quiet --save --save-exact ${installOpts}`)
    shell.exec(`cd ${dependencyPath} && rm ${packageLockJsonPath}`)
    shell.exec(`git add ${packageJsonPath}`)
  }

  shell.exec(`git commit -m "${msg}"`)

  // fail if there are other unchanged files
  if (shell.exec('git status --porcelain').stdout.trim() != "") {
      throw 'Git repo is dirty, there are changes that aren\'t accounted for\n' + shell.exec('git status').stdout
  }

  if (!TESTING) {
    shell.exec(`git push --set-upstream origin ${branchName}`)
    shell.exec(shellQuote.quote(['pullrequest', '--branch', branchName, '--title', msg, '--body', prBody]))
  }

  dependencyJSON = JSON.stringify({'dependencies': [dependency]})
  console.log(`BEGIN_DEPENDENCIES_SCHEMA_OUTPUT>${dependencyJSON}<END_DEPENDENCIES_SCHEMA_OUTPUT`)

})
