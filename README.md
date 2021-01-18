# RCC — Reload Cloudflare Cache

## Goal

Screenshot all linked pages from a given URL, in order to unsure that Cloudflare
will cache them all.

Our cloudflare's cache configuration is set to expire in less tham 15 minutes,
but in case of a long maintenance of our website we want to rely on cloudflare
to serve our pages from cache for a longer period. Once the cloudflare
configuration is changed, we needed a way to query all our URLs to be sure that
they will be cached in cloudflare service.

## Usage

There is different way to use "RCC":

### With an starting URL

`npm start -- --url https://www.epfl.ch --limit epfl.ch --report --no-screenshot`

This means that the script will fetch all links on https://www.epfl.ch, keep
only the ones with "epfl.ch" in them (`--limit`). Additionaly, it will generate
a basic report (`--report`) and will be faster, as the `--no-screenshot` is
specified.


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

### With an starting file

`npm start -- --file './data/__out/urls.txt' --performance --report --useragent FSD`

This means that it will takes all URLs from the `urls.txt` file (one URL per
line), display some performance information (`--performance`), generate a basic
report (`--report`) and add a suffix to the user agent string (`--useragent`).

#### Generate a list of URL

When using the "starting file mode", you can use the `qalpl.js` script (adapted
from [https://gitlab.com/epfl-dojo/qalpl](https://gitlab.com/epfl-dojo/qalpl)).

The usage is:

`node qalpl.js [site] [depth] [concurrency] [outfile]`,
e.g. `node qalpl.js https://www.epfl.ch 2 1 urls.txt`.

Be warn that increasing `depth` and `concurrency` can be very ressources
demanding both for you and the sites that your are scraping!
