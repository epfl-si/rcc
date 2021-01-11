import { URL } from 'url'
import fs from 'fs'
import puppeteer from 'puppeteer'
import tld from 'tld-extract'
import { performance } from 'perf_hooks'
import { report, vURL } from './types'

const dataDir = 'data'

const validateURL = (link: string): vURL => {
  const url = new URL(link)
  const urlInfo = tld(url.toString())
  const trimmedDomain = urlInfo.domain.replace('.' + urlInfo.tld, '')
  const fileName = `${url.hostname}${url.pathname}`.replace(/\/+$/, '').replace(/\//g, '_')
  return {
    url,
    path: `${urlInfo.tld}/${trimmedDomain}/${urlInfo.sub}`,
    file: fileName,
    info: urlInfo,
  }
}

const explore = async (link: string, opts: any): Promise<report> => {
  const t0 = performance.now()

  const url = validateURL(link)

  let report: report = {
    max: { url, time: 0 },
    min: { url, time: 1000 },
    total: { visited: 0, excluded: 0, time: 0, links: 0 },
    average: 0,
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--start-maximized', '--window-size=1200,900'], // defaut size is 800x600 and the "mobile" menu can be displayed
    defaultViewport: null,
  })
  const page = await browser.newPage()

  if (opts.useragent) {
    const userAgent = await page.evaluate(() => navigator.userAgent)
    await page.setUserAgent(`${userAgent} ${opts.useragent}`)
  }

  if (!opts.quiet) {
    const uA = await page.evaluate(() => navigator.userAgent)
    console.log(`User agent: ${uA}`)
  }

  // see https://stackoverflow.com/a/57677369 for other value of "waitUntil"
  await page.goto(url.url.href, { waitUntil: 'networkidle2', timeout: Number(opts.timeout) }) // .catch(e => void 0)

  // get all links on page
  let links = await page.$$eval('a', as => as.map((a: any) => a.href.split('#')[0]))

  // dedup and sort links
  links = [...new Set(links)]
  links.sort()
  report.total.links = links.length
  console.log(report.total.links)

  // loop over page's links
  for (const href of links) {
    const siteT0 = performance.now()

    if (!href.startsWith('http')) {
      report.total.excluded++
      continue
    }

    let currentURL
    try {
      currentURL = validateURL(href)
    } catch (e) {
      console.error(`URL error: ${href}`)
      console.error(e)
      continue
    }

    if (opts.limit !== currentURL.info.domain) {
      if (!opts.quiet) console.log(`✖ ${href} excluded from defined limit: "${opts.limit}" (${currentURL.info.domain})`)
      report.total.excluded++
      continue
    }

    if (!opts.quiet) console.log(`\n✓ ${href}`)

    try {
      await page.goto(currentURL.url.href, { waitUntil: 'networkidle2', timeout: Number(opts.timeout) }) // .catch(e => void 0)
      report.total.visited++

      if (opts.screenshot) {
        // ensure the path exists
        fs.mkdir(`${dataDir}/${currentURL.path}`, { recursive: true }, err => {
          if (err) throw err
        })

        await page.screenshot({
          path: `${dataDir}/${currentURL.path}/${currentURL.file}.png`,
          fullPage: true,
        })

        if (!opts.quiet) {
          console.log(`  ↳ Screenshot: file://${__dirname}/${dataDir}/${currentURL.path}/${currentURL.file}.png`)
        }
      }
    } catch (e) {
      console.error(e)
    }

    const siteT1 = performance.now()
    const tetSite = Number(((siteT1 - siteT0) / 1000).toFixed(2))

    if (tetSite > report.max.time) {
      report.max = {
        url: currentURL,
        time: tetSite,
      }
    }
    if (tetSite > 0 && tetSite < report.min.time) {
      report.min = {
        url: currentURL,
        time: tetSite,
      }
    }

    if (opts.performance && !opts.quiet) {
      console.log(`  ↳ Site execution time ${tetSite} seconds.`)
    }
  }

  const t1 = performance.now()
  report.total.time = Number(((t1 - t0) / 1000).toFixed(2))
  if (opts.performance && !opts.quiet) {
    console.log(`Total execution time ${report.total.time} seconds.`)
  }

  report.average = Number((report.total.time / report.total.visited).toFixed(2))

  await browser.close()

  return report
}

export default explore
