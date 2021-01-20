#!/usr/bin/env node

// External
const inquirer = require('inquirer')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const CWD = process.cwd()

async function handle() {
    // get all files and folders, then filter out the files
    const contents = await fs.readdirSync(path.normalize(CWD), {
        encoding: 'utf8',
        withFileTypes: true
    })
    const dirs = contents.filter(v => v.isDirectory() === true)
    // and grab their names
    let dirNames = dirs.map(v => v.name)

    // now sort into dotfiles `.` and regular folders
    dirNames = dirNames.sort()
    // then split into enabled and disabled mods
    const disabledMods = dirNames.filter(v => v.startsWith(`.`) === true)
    const enabledMods = dirNames.filter(v => v.startsWith(`.`) === false)

    // create the choices and flatten the array
    const choices = [
        new inquirer.Separator(' = Enabled = '),
        enabledMods,
        new inquirer.Separator(' = Disabled = '),
        disabledMods
    ].flat(2)

    // now create the question
    const modQuestion = {
        type: 'checkbox',
        message: `Tick each box to enable or disable a mod!`,
        name: "mods",
        choices: choices,
        validate: (answer) => {
            if (answer.length < 1) {
                return 'You must choose at least one mod.'
            }
            return true
        }
    }
    const results = await inquirer.prompt(modQuestion)

    // now enable and disable the mods
    for (mod of results.mods) {
        const dir = dirs.find(v => v.name === mod)
        if (dir.name.startsWith(`.`)) {
            const noDotName = dir.name.slice(1) // remove the `.`
            try {
                await fs.renameSync(path.normalize(path.join(CWD, dir.name)), path.normalize(path.join(CWD, noDotName)))
                console.log(chalk.greenBright(`The mod "${chalk.yellowBright(noDotName)}" was enabled!`))
            } catch (e) {
                console.log(chalk.red.bold(`There was an error! Exiting...\nError: ${e.stack}`))
                process.exit(1)
            }
        } else {
            try {
                await fs.renameSync(path.normalize(path.join(CWD, dir.name)), path.normalize(path.join(CWD, `.${dir.name}`)))
                console.log(chalk.greenBright(`The mod "${chalk.yellowBright(dir.name)}" was disabled!`))
            } catch (e) {
                console.log(chalk.red.bold(`There was an error! Exiting...\nError: ${e.stack}`))
                process.exit(1)
            }
        }
    }
}


handle().catch(e => {
    console.log(chalk.red.bold(`UNCAUGHT ERROR:\n${e.stack}`))
})