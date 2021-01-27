/*
  @TODO:
    - use commander.js to have better arguments handling
    - improve the output options (choose wich log to display)
    - create a summary/report at the end including but not limited to
      - longest URL
      - times
      - visited + collected URLs amount
      - error list
    - add the limit options
    - add the ability to keep the PDF url but not visit them
    - change cheerio to collect images and file links in addition to href
*/

const cheerio = require('cheerio')
const rp = require('request-promise')
const fs = require('fs')
const axios = require('axios')
const URL = require('url')
const AsyncCachePromise = require('async-cache-promise')
const EventEmitter = require('events').EventEmitter

/* Args from command line or default values */
const start = new Date()
const dtPrefix = start.toISOString().replace(/T/, '_').replace(/-|:/g, '').replace(/\..+/, '')
const args = process.argv
const entryURL = args[2] || 'https://www.epfl.ch'
const txtURL = entryURL.replace(/:|\/|\./g,'_')
const depth = args[3] || 1
const concurrency = args[4] || 5
const output_file = args[5] || `${dtPrefix}_${txtURL}_d${depth}_c${concurrency}.txt`
const output_log = args[6] || `${dtPrefix}_${txtURL}_d${depth}_c${concurrency}_logs.json`
const output_folder = './data/__out'
const urlIncludes = 'www.epfl.ch'

if (!fs.existsSync(output_folder)) {
  fs.mkdirSync(output_folder)
}

/**
 * Limit invocations of `funk` to at most `concurrency` at a time.
 *
 * @return An async function that works like `funk` (same arguments,
 *         same (promised) return value), but may take longer.
 */
let Limitator = (concurrency, funk) => {
  let running = [],
    waiting = []

  function awaitSlot() {
    return new Promise((resolve, reject) => {
      waiting.push({ resolve, reject })
      shake()
    })
  }

  function releaseSlot(slot) {
    const oldLength = running.length
    running = running.filter(s => s !== slot)
    if (running.length != oldLength - 1) {
      throw new Error('Assumption violated in releaseSlot!')
    }
    shake()
  }

  function shake() {
    if (running.length >= concurrency) return
    const next = waiting.shift() // LIFO
    if (!next) return
    running.push(next)
    next.resolve(next)
  }

  return async function (args) {
    let slot = await awaitSlot()
    try {
      return await funk(args)
    } finally {
      releaseSlot(slot)
    }
  }
}

let getPageBody = Limitator(concurrency, async url => {
  return await rp(url)
})

async function getPageLinks(url, body) {
  let retval = []
  if (!isPDF(url)) {
    if (typeof body !== 'string') {
      debugger
    }
    const $ = await cheerio.load(body)

    $('a').map(function (i, e) {
      let href = $(e).attr('href')
      if (!href || href.match('mailto:') || href.match('tel:')) return
      //visited.collected_add(URL.resolve(url, href))
      retval.push(URL.resolve(url, href))
    })
  }
  return retval
}

let isPDF = url => {
  return URL.parse(url).pathname.endsWith('.pdf')
}

const backlog = (() => {
  const backlog = {}

  return {
    has(l) {
      return !!backlog[l]
    },
    add(l) {
      backlog[l] = 1
    },
  }
})()

async function scrape(url, depth, opts) {
  if (!opts) opts = {}
  if (!opts.observer) {
    opts.observer = { emit() {} }
  }
  if (depth <= 0) return

  let body
  try {
    body = await getPageBody(url)
  } catch (e) {
    opts.observer.emit('error', e, url)
    return
  }
  let links = await getPageLinks(url, body)
  if (opts.keep) links = links.filter(opts.keep)

  opts.observer.emit('visited', url, body, depth)

  function canonicalizeUrl(url) {
    return URL.parse(url).protocol + '//' + URL.parse(url).hostname + URL.parse(url).pathname
  }

  const uniqueCanonicalLinks = [...new Set(links.map(canonicalizeUrl))]
  for (let l of uniqueCanonicalLinks) {
    opts.observer.emit('link', url, l)
  }
  const newLinks = uniqueCanonicalLinks.filter(l => !backlog.has(l))
  for (let l of newLinks) {
    opts.observer.emit('newlink', url, l)
    backlog.add(l)
  }

  await Promise.all(newLinks.map(l => scrape(l, depth - 1, opts)))
}

const run_scrape = async (entryURL, depth, callbacks) => {
  const observer = new EventEmitter()

  for (const cb in callbacks) {
    debugger
    let matched
    if ((matched = cb.match(/^on(.*)$/))) {
      observer.on(matched[1].toLowerCase(), callbacks[cb])
    }
  }

  await scrape(entryURL, depth, {
    keep(url) {
      return url.includes(urlIncludes) && !isPDF(url)
    },
    observer,
  })
}

const pageStats = (function PageStats() {
  const stats = {}

  function statsOf(page) {
    if (!stats[page]) stats[page] = {}
    return stats[page]
  }
  function setOf(page, key) {
    const stats = statsOf(page)
    if (!stats[key]) stats[key] = new Set()
    return stats[key]
  }
  return {
    link(from, to) {
      setOf(from, 'linksFrom').add(to)
      setOf(to, 'linksTo').add(from)
    },
    success(at, body) {
      statsOf(at).status = 'OK'
    },
    error(at, error) {
      statsOf(at).status = 'ERROR'
      statsOf(at).error = error
    },
    report() {
      return stats
    },
  }
})()

let logStream = fs.createWriteStream(`${output_folder}/${output_file}`, { flags: 'w' })
run_scrape(entryURL, depth, {
  onVisited(url, body, depth) {
    console.log(`⟴  ${url} (visited at depth ${depth}) is ${body.length} characters long`)
    pageStats.success(url, body)
  },
  onNewLink(url, newLink) {
    console.log(` ↯ New link ${newLink} found at ${url}`)
    logStream.write(`${newLink}\n`)
  },
  onLink(url, link) {
    //console.log(` ↝ Link found ${link} found at ${url}`)
    pageStats.link(url, link)
  },
  onError(error, url) {
    if (error.options && error.options.uri) {
      console.error(`Error at ${error.options.uri}`)
    } else {
      console.error(error)
    }
    pageStats.error(url, error)
  },
}).then(() => {
  logStream.end()
  //console.log(pageStats.report())
  console.info(`\n⇨ Execution time: ${(new Date() - start)/1000}`)
  console.info(`⇨ Collected URL written: ${output_folder}/${output_file}`)
  fs.writeFile(`${output_folder}/${output_log}`, JSON.stringify(pageStats.report(), null, 2), (err) => {
    if (err) throw err
    console.info(`⇨ Logs written: ${output_folder}/${output_log}`)
  })

})
