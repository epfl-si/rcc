import { explore, discover } from './explore'
import lecommander from 'commander'

const start = async () => {
  let reports: any

  if (lecommander.url) {
    reports = await explore(lecommander.url, lecommander.opts())
  }
  if (lecommander.file) {
    reports = await discover(lecommander.file, lecommander.opts())
  }
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
  .option('-d, --dimension <dimension>', 'set dimension', '1300,1000')
  .option('-f, --file <file>', '`file` containing urls to visit')
  .option('-l, --limit <domain>', 'limit to a specific domain')
  .option('-ns, --no-screenshot', 'save screenshot of visited site')
  .option('-o, --dump-options', 'dump run time options', false)
  .option('-p, --performance <bool>', 'show performance data', true)
  .option('-q, --quiet', 'limit ouptut console', false)
  .option('-r, --report', 'output final report', false)
  .option('-t, --timeout <timeout>', 'set timeout in milliseconds', '30000')
  .option('-u, --url <url>', '`url` to start with', false)
  .option('-ua, --useragent <useragent>', 'set useragent', 'idev-fsd')

lecommander.parse(process.argv)
if (!lecommander.url && !lecommander.file) {
  lecommander.help()
}
if (lecommander.dumpOptions) {
  console.log(lecommander.opts())
}
if (lecommander.url && !lecommander.quiet) {
  console.log(`Starting point: ${lecommander.url}`)
}
if (lecommander.file && !lecommander.quiet) {
  console.log(`Starting point: ${lecommander.file}`)
}
lecommander.performance = primitiveToBoolean(lecommander.performance)

start()
