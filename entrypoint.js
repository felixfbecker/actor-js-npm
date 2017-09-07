const path = require('path')
const shell = require('shelljs')
const shellQuote = require('shell-quote')
const fs = require('fs')

const REPO_PATH = '/repo'
const TESTING = (process.env.DEPENDENCIES_ENV || 'production') == 'test'
const ACTOR_ID = process.env.ACTOR_ID
const GIT_SHA = process.env.GIT_SHA
const NPMRC = process.env.SETTING_NPMRC
const dependencies = JSON.parse(process.env.DEPENDENCIES)['dependencies']

shell.set('-e')  // any failing shell commands will fail

if (NPMRC) {
    console.log('.npmrc contents found in settings, writing to /home/app/.npmrc...')
    fs.writeFileSync('/home/app/.npmrc', NPMRC)
    console.log(NPMRC)
}

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

  const nodeModulesPath = path.join(dependencyPath, 'node_modules')
  const tmpNodeModulesPath = path.join('/tmp', nodeModulesPath)

  if (!fs.existsSync(tmpNodeModulesPath)) {
    // install everything the first time, then keep a copy of those node_modules
    // so we can copy them back in before we work on each branch
    if (hasYarnLockFile) {
      shell.exec(`cd ${dependencyPath} && yarn install --ignore-scripts`)
    } else {
      shell.exec(`cd ${dependencyPath} && npm install  --ignore-scripts --quiet`)
    }

    // save these in /tmp for future branches working on the same file
    console.log(`Copying node_modules from ${nodeModulesPath} into ${tmpNodeModulesPath} for future use...`)
    shell.mkdir('-p', tmpNodeModulesPath)
    shell.cp('-R', nodeModulesPath, tmpNodeModulesPath)
  } else {
    // copy our cached node_modules in
    console.log(`Copying node_modules from ${tmpNodeModulesPath} into ${nodeModulesPath}...`)
    shell.cp('-R', tmpNodeModulesPath, nodeModulesPath)
  }

  // branch off of the original commit that this build is on
  shell.exec(`git checkout ${GIT_SHA}`)
  shell.exec(`git checkout -b ${branchName}`)

  if (hasYarnLockFile) {
    let packageJsonVersionSpecifier
    if (isDevDependency) {
      packageJsonVersionSpecifier = packageJson.devDependencies[name]
    } else {
      packageJsonVersionSpecifier = packageJson.dependencies[name]
    }

    let packageJsonVersionRangeSpecifier = ''
    if (packageJsonVersionSpecifier.startsWith('^')) {
      packageJsonVersionRangeSpecifier = '^'
    } else if (packageJsonVersionSpecifier.startsWith('~')) {
      packageJsonVersionRangeSpecifier = '~'
    }

    const versionWithRangeSpecifier = packageJsonVersionRangeSpecifier + version

    shell.exec(`cd ${dependencyPath} && yarn upgrade ${name}@${versionWithRangeSpecifier} --ignore-scripts`)
    shell.exec(`git add ${packageJsonPath} ${yarnLockPath}`)
  }
  else if (hasPackageLockFile) {
    shell.exec(`cd ${dependencyPath} && npm install ${name}@${version}  --ignore-scripts --quiet`)
    shell.exec(`git add ${packageJsonPath} ${packageLockJsonPath}`)
  } else {
    const installOpts = isDevDependency ? '--save-dev' : ''
    shell.exec(`cd ${dependencyPath} && npm install ${name}@${version}  --ignore-scripts --quiet --save --save-exact ${installOpts}`)
    shell.exec(`cd ${dependencyPath} && rm ${packageLockJsonPath}`)
    shell.exec(`git add ${packageJsonPath}`)
  }

  // remove node_modules
  shell.rm('-rf', nodeModulesPath)

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
