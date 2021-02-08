/*
 *                  __         .__
 *   ___  ___ _____/  |_  ____ |  |__ ___.__.
 *   \  \/  // __ \   __\/ ___\|  |  <   |  |
 *    >    <\  ___/|  | \  \___|   Y  \___  |
 *   /__/\_ \\___  >__|  \___  >___|  / ____|
 *         \/    \/          \/     \/\/
 *
 * XML Wordpress wp-sitemap.xml links fetcher
 *
 * The script will generate a text file containing
 * all Wordpress site URLs found by browsing the
 * wp-sitemap.xml file.
 *
 */

const fetch = require('node-fetch')
const parseString = require('xml2js').parseString
const fs = require('fs')
const urlfile = 'urls.txt'
const logfile = 'err.log'

/*
* Append data in file
*/
const append = (data, file=urlfile) => {
  fs.appendFileSync(file, `${data}\n`)
}

/*
 * Get sites' list from wp-veritas.epfl.ch
 */
const fetchVeritas = async () => {
  try {
    return fetch('https://wp-veritas.epfl.ch/api/v1/sites')
      .then(res => res.json())
      .then(json => json)
  } catch (e) {
    append(`[fetchVeritas] ${e}`, logfile)
    console.error('\x1b[31m%s\x1b[0m', `☈ [fetchVeritas] ${e}\n`)
    return []
  }
}

/*
 * Filter wp-veritas sites' list on "openshiftEnv"
 */
const filterSites = (sites) => {
  return sites.filter(function(site) {
    return !site.openshiftEnv.includes('form') &&
      !site.openshiftEnv.includes('inside') &&
      !site.openshiftEnv.startsWith('unm-') &&
      site.wpInfra
  })
}

/*
 * Get links found in the sitemap.xml
 *
 * Assuming site is ending with /
 */
const getSitemapLoc = async (site) => {
  let sitemap
  try {
    sitemap = await fetch(`${site}wp-sitemap.xml`)
    .then(res => res.text())
    .then(body => body)
  } catch (e) {
    append(`[getSitemapLoc](${site}) ${e}`, logfile)
    console.error('\x1b[31m%s\x1b[0m', `☈ [getSitemapLoc](${site}) ${e}`)
    return []
  }

  let loc = ''
  try {
    parseString(sitemap, function(err, result) {
      // if (err) console.error(`[parseString/sitemap](${site}) ${err}`)
      loc = result.sitemapindex.sitemap
    })
  } catch (e) {
    append(`[parseString/sitemap](${site}) ${e}`, logfile)
    console.error('\x1b[31m%s\x1b[0m', `☈ [parseString/sitemap](${site}) ${e}`)
    return []
  }

  let urls = []
  for (let url of loc) {
    urls.push(url.loc[0])
  }
  return urls
}

/*
 * Collect links found on each xml file from the sitemap
 */
const getSitePages = async (sitemapTypeURL) => {
  let sitePages
  try {
    sitePages = await fetch(sitemapTypeURL)
    .then(res => res.text())
    .then(body => body)
  } catch (e) {
    append(`[getSitePages](${sitemapTypeURL}) ${e}`, logfile)
    console.error('\x1b[31m%s\x1b[0m', `☈ [getSitePages](${sitemapTypeURL}) ${e}`)
    return []
  }

  let pageURL = ''
    try {
    parseString(sitePages, function(err, result) {
      //if (err) console.error(`[parseString/sitePages](${sitemapTypeURL}) ${err}`)
      pageURL = result.urlset.url
    })
  } catch (e) {
    append(`[parseString/sitePages](${sitemapTypeURL}) ${e}`, logfile)
    console.error('\x1b[31m%s\x1b[0m', `☈ [parseString/sitePages](${sitemapTypeURL}) ${e}`)
    return []
  }

  let urls = []
  for (let url of pageURL) {
    urls.push(url.loc[0])
  }
  return urls
}

const init = async () => {
  const start = new Date()

  fs.truncate(urlfile, 0, function() { console.log(`Output file "${urlfile}" cleaned`) })
  fs.truncate(logfile, 0, function() { console.log(`Output file "${logfile}" cleaned`) })

  // get site from wp-veritas
  let wpvsites = await fetchVeritas()
  // filter sites to keep only the one we need
  wpvsites = filterSites(wpvsites)
  let total = wpvsites.length
  let current = 0

  // uncomment the following to test specific URLs
  /*wpvsites = [
    {'url':'https://ivea.epfl.ch/'},
    {'url':'https://iveaXXX.epfl.ch/'}, // ENOTFOUND
    {'url':'https://www.epfl.ch/'},
    {'url':'https://www.epfl.ch/labs/ddmac/'},
    {'url':'https://www.epfl.ch/campus/services/events/'},
    {'url':'https://dcsl.epfl.ch/'},
    {'url':'https://www.epfl.ch/campus/art-culture/museum-exhibitions/archizoom/'}, // BIG with post
  ]*/

  // for each site from wp-veritas
  for (let wpsite of wpvsites) {
    current++
    console.info(`\x1b[36m⟴  [${current.toString().padStart(3, '0')}/${total}]\x1b[0m Visiting ${wpsite.url}wp-sitemap.xml`)
    // get the links form wp-sitemap.xml
    let sitemapLoc = await getSitemapLoc(wpsite.url)
    // for each of these links
    for (let xurl of sitemapLoc) {
      console.info('\x1b[34m%s\x1b[0m', `  ↯ Fetching site from ${xurl}`)
      // get the URLs
      let urls = await getSitePages(xurl)
      console.info('\x1b[32m%s\x1b[0m', `    ⤷ ${urls.length} links found`)
      // and append them in the urls.txt file
      urls.map((url) => append(url.replace(/\/$/, "")))
    }
  }
  console.info(`\n⇨ Execution time: ${(new Date() - start)/1000}`)
}
init()
