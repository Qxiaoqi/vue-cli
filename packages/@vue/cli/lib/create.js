const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const Creator = require('./Creator')
const { clearConsole } = require('./util/clearConsole')
const { getPromptModules } = require('./util/createTools')
const { error, stopSpinner, exit } = require('@vue/cli-shared-utils')
const validateProjectName = require('validate-npm-package-name')

async function create (projectName, options) {
  if (options.proxy) {
    process.env.HTTP_PROXY = options.proxy
  }
/*   
  举例 当前目录 Users/xiaoqi/study  使用 vue create vue-cli-study
  cwd = Users/xiaoqi/study
  projectName = vue-cli-study
  inCurrent = true
  name = study
  targetDir = /Users/xiaoqi/study/vue-cli-study
*/  
  
  
// 当前目录
  const cwd = options.cwd || process.cwd()
  const inCurrent = projectName === '.'
// 返回 ../到cwd 的相对路径 
  const name = inCurrent ? path.relative('../', cwd) : projectName
// 将路径片段拼接
  const targetDir = path.resolve(cwd, projectName || '.')
// 验证项目名称是否符合npm规范
  const result = validateProjectName(name)
  if (!result.validForNewPackages) {
    // chalk高亮
    console.error(chalk.red(`Invalid project name: "${name}"`))
    result.errors && result.errors.forEach(err => {
      console.error(chalk.red.dim('Error: ' + err))
    })
    result.warnings && result.warnings.forEach(warn => {
      console.error(chalk.red.dim('Warning: ' + warn))
    })
    exit(1)
  }
  // 如果路径存在，则返回true
  if (fs.existsSync(targetDir)) {
    if (options.force) {
      await fs.remove(targetDir)
    } else {
//    clearConsole() ?
      await clearConsole()

      if (inCurrent) {
//         inquirer npm包 询问
        const { ok } = await inquirer.prompt([
          {
            name: 'ok',
            type: 'confirm',
            message: `Generate project in current directory?`
          }
        ])
        if (!ok) {
          return
        }
      } else {
        const { action } = await inquirer.prompt([
          {
            name: 'action',
            type: 'list',
            message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
            choices: [
              { name: 'Overwrite', value: 'overwrite' },
              { name: 'Merge', value: 'merge' },
              { name: 'Cancel', value: false }
            ]
          }
        ])
        if (!action) {
          return
        } else if (action === 'overwrite') {
          console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
          await fs.remove(targetDir)
        }
      }
    }
  }

  const creator = new Creator(name, targetDir, getPromptModules())
  await creator.create(options)
}

module.exports = (...args) => {
  return create(...args).catch(err => {
    stopSpinner(false) // do not persist
    error(err)
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1)
    }
  })
}
