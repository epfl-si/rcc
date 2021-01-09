import { URL } from 'url'
import fs from 'fs'
import puppeteer from 'puppeteer'
import tld from 'tld-extract'

const dataDir = 'data'

type vURL = {
  url: URL,
  path: string,
  file: string
}

const validateURL = (link: string): vURL => {
  const url = new URL(link)
  const urlInfo = tld(url.toString())
  const trimmedDomain = urlInfo.domain.replace('.' + urlInfo.tld, '')
  const fileName = `${url.hostname}${url.pathname}`
    .replace(/\/+$/, '')
    .replace(/\//g, '_')
  return {
    url,
    path: `${urlInfo.tld}/${trimmedDomain}/${urlInfo.sub}`,
    file: fileName,
  }
}

const screenshot = async (link: string) => {
  const url = validateURL(link)
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'], // one can specify the window size with --window-size=${1200},${900}
    defaultViewport: null,
  })
  const page = await browser.newPage()

  // see https://stackoverflow.com/a/57677369 for other value of "waitUntil"
  await page.goto(url.url.href, { waitUntil: 'networkidle2' }) // .catch(e => void 0)

  // get all links on page
  let links = await page.$$eval('a', (as) => as.map((a: any) => a.href))

  // dedup and sort links
  links = [ ...new Set(links)]
  links.sort()

  // loop over page's links
  for (const href of links) {

    console.log(`\n${href}`)

    if (!href.startsWith('http')) {
      continue
    }
    const currentURL = validateURL(href)

    try {
      await page.goto(currentURL.url.href, { waitUntil: 'networkidle2' }) // .catch(e => void 0)

      // ensure the path exsists
      fs.mkdir(`${dataDir}/${currentURL.path}`, { recursive: true }, (err) => {
        if (err) throw err
      })

      await page.screenshot({
        path: `${dataDir}/${currentURL.path}/${currentURL.file}.png`,
        fullPage: true,
      })
      console.log(` ↳ Screenshot: file://${__dirname}/${dataDir}/${currentURL.path}/${currentURL.file}.png`)
      // PDF ? → await page.pdf({path: '${dataDir}/hn.pdf', format: 'A4'})
    } catch (e) {
      console.error(e)
    }
  }

  await browser.close()
}

// exports.screenshot = screenshot
export default screenshot

// screenshot('https://some.link.com')
