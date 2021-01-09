const { URL } = require('url')
const fs = require('fs')
const puppeteer = require('puppeteer')
const tld = require('tld-extract')
const dataDir = './data'

const validateURL = (url) => {
  const url = new URL(url)
  const urlInfo = tld(url.toString())
  const trimmedDomain = urlInfo.domain.replace('.' + urlInfo.tld, '')
  fileName = `${url.hostname}${url.pathname}`
    .replace(/\/+$/, '')
    .replace(/\//g, '_')
  return {
    url,
    path: `${urlInfo.tld}/${trimmedDomain}/${urlInfo.sub}`,
    file: fileName,
  }
}

const screenshot = async (url) => {
  const url = validateURL(url)
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'], // one can specify the window size with --window-size=${1200},${900}
    defaultViewport: null,
  })
  const page = await browser.newPage()

  // see https://stackoverflow.com/a/57677369 for other value of "waitUntil"
  await page.goto(url.url.href, { waitUntil: 'networkidle2' }) // .catch(e => void 0)

  // get all links on page
  const links = await page.$$eval('a', (as) => as.map((a) => a.href))

  // loop over page's lins
  for (let link of links) {
    const currentURL = validateURL(link)
    await page.goto(currentURL.url.href, { waitUntil: 'networkidle2' }) // .catch(e => void 0)

    // ensure the path exsists
    fs.mkdir(`${dataDir}/${currentURL.path}`, { recursive: true }, (err) => {
      if (err) throw err
    })
    console.log(`Screenshoting ${currentURL.url.href}`)
    await page.screenshot({
      path: `${dataDir}/${currentURL.path}/${currentURL.file}.png`,
      fullPage: true,
    })
    // PDF ? → await page.pdf({path: '${dataDir}/hn.pdf', format: 'A4'})
  }

  await browser.close()
}

exports.screenshot = screenshot
// screenshot('https://some.link.com')
