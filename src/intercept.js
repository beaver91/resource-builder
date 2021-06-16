import fs from 'fs'
import os from 'os'
import colors from 'colors'

/**
 * @link https://stackoverflow.com/questions/46603489/how-to-force-utf-8-in-node-js-with-exec-process
 * @param {string} command
 */
export function chcp(command) {
  if (os.platform() === 'win32') {
    return `@chcp 65001 >nul & ${command}`
  }

  return command
}

export const NL = '\r\n'

/**
 * @param {Array|String} lines
 */
export function verbose(lines) {
  if (lines == NL) {
    process.stdout.write(NL)
    return
  }

  if (typeof lines == 'string') {
    lines = [lines]
  }

  let logs = deepCopy(lines)
  logs[0] = colors.yellow(logs[0])

  logs = logs.map(r => {
    if (/(?:--[\d\w\-]+)/i.test(r)) {
      return colors.grey(r)
    } else if (r == 'true' || r == 'false') {
      return colors.green(r)
    }

    return r
  })

  console.log(`✔ [${colors.green(now())}] ` + logs.join('\n\t'))
}

export function deepCopy(obj) {
  if (obj instanceof Array || obj instanceof Object) {
    return JSON.parse(JSON.stringify(obj))
  }

  return obj
}

/**
 * @param {object} buffer
 * @param {string} prefix
 */
export function spawnIO(buffer, prefix = '') {
  buffer.stdout.on('data', (data) => {
    process.stdout.write(`${colors.yellow(prefix)} ${CRLF(data.toString())}`)
  })

  buffer.stderr.on('data', (data) => {
    process.stderr.write(`${colors.yellow(prefix)} ${CRLF(data.toString())}`)
  })

  buffer.on('close', (code) => {
    console.log(`${colors.yellow(prefix)} child process exited with code ${code}`)
  })
}

export function CRLF(data) {
  return data.replace(/[\r\n]+/g, '\n')
}

export function now() {
  const now = new Date()
  return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
}

/**
 * @param {Array} files
 * @param {string} output
 */
export function cat(files, output) {
  let splitted = output.split(/[\/\\]+/)
  let dirPath = splitted.splice(0, splitted.length - 1)

  fs.mkdirSync(dirPath.join('/'), { recursive: true })
  fs.closeSync(fs.openSync(output, 'w'))

  for (let file of files) {
    let data = fs.readFileSync(file, 'utf8')
    fs.appendFileSync(output, data)
  }
}

export function remove(file) {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file)
    } catch (e) {
      console.error(e)
    }
  }
}

export function packageInfo() {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8'))
}
