import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const run = (label, cmd, args) => {
  const p = spawn(cmd, args, { cwd: __dirname, shell: false, stdio: 'pipe' })
  p.stdout.on('data', d => process.stdout.write(`[${label}] ${d}`))
  p.stderr.on('data', d => process.stderr.write(`[${label}] ${d}`))
  return p
}

console.log('\n  JARVIS V2 starting...\n')
const server = run('SERVER', process.execPath, ['server.js'])
const vite   = run('VITE',   process.execPath, [join('node_modules', 'vite', 'bin', 'vite.js')])
process.on('SIGINT', () => { server.kill(); vite.kill(); process.exit() })
