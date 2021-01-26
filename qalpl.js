const cheerio = require('cheerio')
const rp = require('request-promise')
const fs = require('fs')
const axios = require('axios')
const URL = require('url')
const AsyncCachePromise = require('async-cache-promise')
const EventEmitter = require('events').EventEmitter

/* Args from command line or default values */
const args = process.argv
const entryURL = args[2] || 'https://www.epfl.ch'
const depth = args[3] || 2
const concurrency = args[4] || 10
const output_file = args[5] || 'off'
const output_folder = './data/__out/'

if (!fs.existsSync(output_folder)) {
  fs.mkdirSync(output_folder)
}
const includesURL = ['www.epfl.ch']
//const includesURL = ['www.epfl.ch/labs/alice']
//const includesURL = ['86.119.30.59']
const excludesURL = [
  'absences.epfl.ch',
  'actu.epfl.ch',
  'blogs.epfl.ch',
  'edu.epfl.ch',
  'epnet.epfl.ch',
  'go.epfl.ch',
  'infoscience.epfl.ch',
  'inside.epfl.ch',
  'map.epfl.ch',
  'mediatheque.epfl.ch',
  'memento.epfl.ch',
  'moodle.epfl.ch',
  'mycamipro.epfl.ch',
  'news.epfl.ch',
  'people.epfl.ch',
  'personnes.epfl.ch',
  'plan.epfl.ch',
  'scitas-data.epfl.ch',
  'scitas.epfl.ch',
  'sesame.epfl.ch',
  'wiki.epfl.ch',
]

function Visited() {
  let evt = new EventEmitter()

  var dataURLs = {
    visited: {},
    collected: {},
    visits: 0,
    longest: {
      length: 0,
      url: '',
    },
    current: '',
    pending: '',
  }

  return {
    collected_add(url) {
      if (typeof dataURLs.collected[url] == 'undefined') {
        dataURLs.collected[url] = 1
      } else {
        dataURLs.collected[url] += 1
      }
    },
    collected_has(url) {
      return !!dataURLs.collected[url]
    },

    add(url) {
      dataURLs.current = url
      if (evt) {
        evt.emit('visited', url)
      }
      dataURLs.visited[url] = 1
      dataURLs.visits++
      if (url.length > dataURLs.longest.length) {
        dataURLs.longest.length = url.length
        dataURLs.longest.url = url
        if (evt) {
          evt.emit('longest', url)
        }
      }
    },
    has(url) {
      return !!dataURLs.visited[url]
    },
    evt,
    dataURLs,
  }
}

let Limitator = (concurrency, funk) => {
  var parallel_invokes = 0
  let evt = new EventEmitter()

  let limitated = async function (/* ... */) {
    while (parallel_invokes > concurrency) await sleep(0.25)
    parallel_invokes += 1
    evt.emit('parallels', parallel_invokes)
    let retVal = await funk.apply({}, arguments)
    parallel_invokes -= 1
    evt.emit('parallels', parallel_invokes)
    return retVal
  }
  limitated.on = evt.on.bind(evt)
  return limitated
}

let getPageBody = Limitator(concurrency, async url => {
  try {
    if (!isPDF(url)){
      return await rp(url)
    }
  } catch (e) {
    console.error(e)
  }
})

let visited = Visited()

function View() {
  let observer = visited.evt
  let dataURLs = visited.dataURLs

  observer.on('visited', url => {
    /* ... TODO: count 'em */
    prettyPrint(dataURLs)
    // console.log("Current", dataURLs.current)
  })
  observer.on('longest', url => {
    prettyPrint(dataURLs)
    //console.log("Longest", dataURLs.longest.url, longestURL.longest.length)
  })
  getPageBody.on('parallels', n => {
    dataURLs.pending = n
    prettyPrint(dataURLs)
    //console.log(n + " pending requests")
  })
}
View()

function prettyPrint(data) {
  //let totalvisited = Object.keys(data.visited).length
  let totalvisited = data.visits
  //return true
  console.clear()
  console.log('--------------------------------------------------------------------------------')
  console.log('\x1b[1m', ' Checking:\x1b[0m', entryURL + ' with depth=' + depth + ' and concurrency=' + concurrency)
  console.log('\x1b[1m', '   Output:\x1b[0m', output_file)
  console.log('--------------------------------------------------------------------------------')
  console.log('\x1b[1m', ' Current:\x1b[0m', data.current)
  console.log('\x1b[1m', ' Longest:\x1b[0m', data.longest.length)
  console.log('          ', data.longest.url)
  console.log('\x1b[1m', ' Pending:\x1b[0m', data.pending + ' requests')
  console.log('\x1b[1m', ' Visited:\x1b[0m', totalvisited)
  console.log('--------------------------------------------------------------------------------')
  console.log('--------------------------------------------- https://gitlab.com/epfl-dojo/qalpl')
  console.log('data.collected:', data.collected)

  saveOutput(data.collected)

}

const sleep = sec => {
  return new Promise(resolve => setTimeout(resolve, sec * 1000))
}

async function getPageLinks(url, body) {
  let retval = []
  if (!isPDF(url)) {
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

const saveOutput = result => {
  let data = '';
  for (let index in result ) {
    data += index + '\n'
  }
  fs.writeFile(`${output_folder}${output_file}`, data, function (err) {
    if (err) throw err
  })

}

async function scrape(url, depth, opts) {
  if (!opts) opts = {}
  if (depth <= 0) return
  let body = await getPageBody(url)
  let links = await getPageLinks(url, body)
  if (opts.keep) links = links.filter(opts.keep)
  links.map(new_url => {
    // if (isPDF(new_url)) return

    let cleaned_url_with_http = URL.parse(new_url).protocol + '//' + URL.parse(new_url).hostname + URL.parse(new_url).pathname
    visited.collected_add(cleaned_url_with_http)
    let cleaned_url = URL.parse(new_url).hostname + URL.parse(new_url).pathname
    if (visited.has(cleaned_url)) return

    visited.add(cleaned_url)

    scrape(new_url, depth - 1, opts)
  })
}

const testURL = url => {

  let incl = false
  includesURL.forEach(item => {
    if (url.includes(item)) {
      incl = true
    }
  })

  let excl = true
  excludesURL.forEach(item => {
    if (url.includes(item)) {
      excl = false
    }
  })

  return incl && excl
}

const run_scrape = async(entryURL, depth) => {
  await scrape(entryURL, depth, {
    //keep(url) { return url.match(URL.parse(entryURL).hostname) }
    //keep(url) { return url.includes('.epfl.ch') }
    keep(url) {
      return testURL(url)
    },
  })

}

run_scrape(entryURL, depth)

