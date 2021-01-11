import explore from './explore'
import lecommander from 'commander'

const start = async () => {
  const reports = await explore(lecommander.url, lecommander.opts())
  if (lecommander.report) {
    report(reports)
  }
}

const report = (report: any) => {
  let date = new Date()
  console.log('---------------------------------------')
  console.log(`Date: ${date.toISOString()}`)
  console.log(`Total Executation Time: ${report.total.time}s`)
  console.log(`Visited: ${report.total.visited}`)
  console.log(`Excluded: ${report.total.excluded}`)
  console.log(`Average: ${report.average}`)
  console.log(`Max: ${report.max.time}s for ${report.max.url.url}`)
  console.log(`Min: ${report.min.time}s for ${report.min.url.url}`)
  console.log('---------------------------------------')
}

function primitiveToBoolean(value: string): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  return value.toLowerCase() === 'true' || !!+value // here we parse to number first
}

lecommander.version(require('./package.json').version)
lecommander
  .name('npm start -- ')
  .usage('--url https://www.epfl.ch --limit epfl.ch -d -r -ns')
  .description('An application that screenshot all pages from a starting URL')
  .option('-d, --debug', 'output extra debugging', false)
  .option('-l, --limit <domain>', 'limit to a specific domain')
  .option('-ns, --no-screenshot', 'save screenshot of visited site')
  .option('-p, --performance <bool>', 'show performance data', true)
  .option('-q, --quiet', 'limit ouptut console', false)
  .option('-r, --report', 'output final report', false)
  .option('-t, --timeout <timeout>', 'set timeout in milliseconds', '30000')
  .option('-u, --url <url>', '`url` to start with')
  .option('-ua, --useragent <useragent>', 'set useragent')

lecommander.parse(process.argv)

if (!lecommander.url) {
  lecommander.help()
}

if (lecommander.url && !lecommander.quiet) {
  console.log(`Starting point: ${lecommander.url}`)
}

lecommander.performance = primitiveToBoolean(lecommander.performance)
if (lecommander.debug) console.log(lecommander.opts())

start()
