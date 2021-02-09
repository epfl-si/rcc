# RCC — Reload Cloudflare Cache
<!-- TOC titleSize:2 tabSpaces:2 depthFrom:1 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 skip:1 title:1 charForUnorderedList:* -->
## Table of Contents
* [About](#about)
* [Scripts](#scripts)
  * [qalpl.js](#qalpljs)
    * [Usage](#usage)
  * [wget](#wget)
  * [fetch_all_urls.rb](#fetchallurlsrb)
  * [xetchy.js](#xetchyjs)
  * [RCC](#rcc)
    * [Options](#options)
    * [With an starting URL](#with-an-starting-url)
    * [With an starting file](#with-an-starting-file)
  * [split.sh](#splitsh)
* [Ansible](#ansible)
* [How To](#how-to)
  * [Without ansible](#without-ansible)
* [Notes on Cloudflare and Varnish](#notes-on-cloudflare-and-varnish)
<!-- /TOC -->

## About

Due to a datastorage maintenance, we had to find a way to ensure our users
would still be able to access ours websites. We are managing more that 600 of
thoses, all using WordPress and deployed on a kubernetes cluster run by
OpenShift. Each website share the same container image with a webserver,
WordPress core files are volumes mounted from the same place. Website files (as
for wp-content/uploads or index.php) are also volumes mounted from the
datastorage. Each website have a database which is external.

During the maintenance, we wanted to be able to downscale the pods running ours
website to 0, meaning that nothing will handle the requests.

As we are using both Cloudflare and Varnish, we decided to rely on those to
serve cached pages to our users. In order to create or renew the cache on these,
we had to create scripts that would access all ours pages. This repository is
a collection of scripts and attempts to achieve that.

Please note that this repository is named RCC for Reload Cloudflare Cache, but
this isn't accurate anymore.


## Scripts

Explaination of content of this repository.


### qalpl.js

Also known as "Qui A La Plus Longue", was a project done in EPFL's coders dojo
some time ago, aiming to collect all the links of a web page in order to find
the longest one. Original source code can be found here:
https://gitlab.com/epfl-dojo/qalpl

Due to performance problems (especially when scraping a lot of entries), we
tried to make it more reliable using [Bitset](https://en.wikipedia.org/wiki/Bit_array)
and [Semaphore](https://en.wikipedia.org/wiki/Semaphore_(programming)).

But still, our WordPress menu display more than 6000 entries on each page,
making the navigation tree quite big. While it work fine on small website with
a reasonable depth of scraping, it need more work to work for our usecase (i.e.
refactor and using a database like redis to rely on).

#### Usage

`node qalpl.js [site] [depth] [concurrency] [outfile]`,
e.g. `node qalpl.js https://www.epfl.ch 2 1 urls.txt`.

### wget

[wget](https://www.gnu.org/software/wget/) has some nice built-in feature to
scrape web pages. Command like the following will do the job up to a certain
point:
```
wget -nv -r -l 2 --domains=www.epfl.ch --delete-after -o wget.log \
  https://www.epfl.ch/ \
  & tail -f wget.log
```

The main issue for us was to ensure every element of the page (such as images)
get a HTTP request in order to be cached on one of our servers.


### fetch_all_urls.rb

As all our websites are recent WordPresses (>5.5), they will expose a sitemap
index at /wp-sitemap.xml. This is the main XML file that contains the listing
of all the sitemap pages exposed by a WordPress site ([source](https://make.wordpress.org/core/2020/07/22/new-xml-sitemaps-functionality-in-wordpress-5-5/)). We first wrote a bash script
unsing the well known `curl` and `jq`, but parsing XML with bash is kind of a
PITA, that's why eventually it has been written in Ruby.

The script will get a list of website from our API (wp-veritas), move towards
sites' sitemaps to collect the links of each site to save them in a `urls.txt`
file. It has some cache features too.

It work fine on a clean base of URLs, but some work has to be done to avoid
crash if URLs are not valids. Also, URLs filters are not parametrables for now.


### xetchy.js

Roughly the same as `fetch_all_urls.rb` but rewritten in node.js (because why
not and most importantly the rest of the code base is also in nodejs) and with
not cache features implemented.

It's pretty resiliant on errors and get a pretty output logs.


### RCC

It's a program in typescript that use [puppeteer](https://pptr.dev/) to visit
webpage (and wait for the full page load). It has capabilities to caputre a
screenshot of the visited web page.

It has two modes of operation: the scraper (when using an input URL) where it
will follow the links it finds and can be resource-consuming and the explorer
(when using an input file), where it will just visit the links provided in the
file.

#### Options

| arg   | full                      | description                     | default  |
| ----- | ------------------------- | ------------------------------- | -------- |
| `-f`  | `--file <file>`           | `file` containing urls list     | required |
| `-l`  | `--limit <domain>`        | limit to a specific domain      | false    |
| `-ns` | `--no-screenshot`         | save screenshot of visited site | false    |
| `-o`  | `--dump-options`          | dump run time options           | false    |
| `-p`  | `--performance`           | show performance data           | true     |
| `-q`  | `--quiet`                 | limit ouptut console            | false    |
| `-r`  | `--report`                | output final report             | false    |
| `-t`  | `--timeout <timeout>`     | set timeout in milliseconds     | 30000    |
| `-u`  | `--url <url>`             | `url` to start with             | required |
| `-ua` | `--useragent <useragent>` | set useragent                   | idev-fsd |

#### With an starting URL

`npm start -- --url https://www.epfl.ch --limit epfl.ch --report --no-screenshot`

This means that the script will fetch all links on https://www.epfl.ch, keep
only the ones with "epfl.ch" in them (`--limit`). Additionaly, it will generate
a basic report (`--report`) and will be faster, as the `--no-screenshot` is
specified.


#### With an starting file

`npm start -- --file './data/__out/urls.txt' --performance true --report --useragent FSD`

This means that it will takes all URLs from the `urls.txt` file (one URL per
line), display some performance information (`--performance`), generate a basic
report (`--report`) and add a suffix to the user agent string (`--useragent`).


### split.sh

A bash script that can [split](https://www.gnu.org/software/coreutils/manual/html_node/split-invocation.html)
a file in "n" chunks. Used on `urls.txt` to distribute the input on different
server.


## Ansible

The `ansible` folder contains all the jam to be able to install, deploy and run
theses scripts on remote computers.

One can launch the ansible script using `./ansible/rccsible`
There are several tags avalaible, such as `soft`, `access`, `deploy`, `run`.
Read [./ansible/playbooks/main.yml](playbooks/main.yml) for details.
Each of these tags get some subtags, defined in each roles, e.g. `deploy.clone`,
`deploy.npm`, `run.rcc` etc.

The main idea is to be able to setup remote computers and be able to launch the
scraping scripts in tmux windows — [tmux 101](https://gist.github.com/meilinger/861b310b651c5812b5b246fc9753b2ac) may help.


## How To

Now that all scripts are kind of explained, how one can use them ? Long story
short: I don't kown. These are pretty specific to our usage and while you should
be able to adapt them to your usage, you'll need to dive into the code. However,
this is how we plan to use them:

### Without ansible

1. First we need to collect all URL. For that, run `node xetchy.js`. It takes
   around 5 minutes and will generate 2 files:
    - `err.log` in which you will find the site that were not able to be parsed;
    - `urls.txt` in which you will find all the collected URLs.
   The `urls.txt` file contains about 37k URLs.
2. Depending of your usecase, you may want to ensure URLs don't have a trailing
   slash, i.e. to follow and cache 301 redirects. The following code might help:
   ```bash
   while IFS= read -r u; do
     echo ${u%/} >> url_notrailingslash.txt
   done < ./urls.txt
   mv url_notrailingslash.txt urls.txt
   ```
3. Another optional step is to complete the `urls.txt` with some others URLs.
   In our case, we get a tons (well one thousand) of hardcoded subdomains that
   serve a 301 redirect to the "real" site. As for the point 2. we also want
   to visit and cache thoses.
4. While it would be possible to use the `urls.txt` file "as is", visiting 37k
   URLs can take quite some time (between few seconds to 30 (which
   is the timeout) for each URL). If the average is 5 seconds, you will need a
   bit more that 50 hours. As for us, you probably don't want to keep a week of
   cache just to be sure that the script get the time to finish. So the plan is
   to split this file into chunks we can run in parallel. To do so, run
   `./split.sh urls.txt 12` resulting in 12 `urls_splitted_xx.txt` files. In
   case it wasn't possible to divide the file in equal parts, you may find 13
   files. You can remediate of this extra file with something like
   `cat urls_splitted_12.txt >> urls_splitted_11.txt && rm urls_splitted_12.txt`.
5. Now it's time to visit all these links. To do so, use
   ```bash
   time npm start -- \
      --file 'urls_splitted_00.txt' \
      --no-screenshot \
      --performance true \
      --report \
      --useragent FSD
    ```
    and go for a walk.
    At the end of the script, it will display a short summary (hence the
    `--report` in parameters):
    ```
    Total execution time 17.95 seconds.
    ---------------------------------------
    Date: 2021-02-09T11:43:43.505Z
    Total Executation Time: 17.95s
    Visited: 10
    Excluded: 1
    Average: 1.79
    Max: 2.91s for https://www.epfl.ch/the/slowest/link
    Min: 1.33s for https://www.epfl.ch/the/fastest/link
    ---------------------------------------
    ```

## Notes on Cloudflare and Varnish
[WIP]

