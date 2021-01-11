import screenshot from './screenshot'
import lecommander from 'commander'
import { performance } from 'perf_hooks'

const start = async () => {
  const t0 = performance.now()
  await screenshot(lecommander.url, lecommander.opts())
  const t1 = performance.now()
  const tet = ((t1 - t0) / 1000).toFixed(2)
  console.log(`Total execution time ${tet} + " seconds.`)
}

lecommander.version(require('./package.json').version)
lecommander
  .name('npm start -- ')
  .usage('--url https://www.epfl.ch --limit epfl.ch')
  .description('An application that screenshot all pages from a starting URL')
  .option('-d, --debug', 'output extra debugging', false)
  .option('-l, --limit <domain>', 'limit to a specific domain')
  .option('-q, --quiet', 'limit ouptut console', false)
  .option('-r, --report', 'output final report', false)
  .option('-u, --url <url>', '`url` to start with')

lecommander.parse(process.argv)

if (!lecommander.url) {
  lecommander.help()
}

if (lecommander.url && !lecommander.quiet) {
  console.log(`Starting from: ${lecommander.url}`)
}

if (lecommander.debug) console.log(lecommander.opts())
start()
