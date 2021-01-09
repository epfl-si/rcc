import screenshot from './screenshot'
import lecommander from 'commander'

lecommander.version(require('./package.json').version)
lecommander
  .name('npm start -- ')
  .usage('--url https://www.epfl.ch')
  .description('An application that screenshot all pages from a starting URL')
  .option('-d, --debug', 'output extra debugging', false)
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

screenshot(lecommander.url, lecommander.opts())
