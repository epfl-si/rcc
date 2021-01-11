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

`npm start -- --url https://www.epfl.ch --limit epfl.ch`

### Options

| arg | full               | description                | default  |
| --- | ------------------ | -------------------------- | -------- |
| `-d`| `--debug`          | output extra debugging     | false    |
| `-l`| `--limit <domain>` | limit to a specific domain | false    |
| `-q`| `--quiet`          | limit ouptut console       | false    |
| `-r`| `--report`         | output final report        | false    |
| `-u`| `--url <url>`      | `url` to start with        | required |

## ToDos
- [ ] add a timer (per site + total)
- [ ] add a report after exectution (num of screenshots, error, ...)
- [x] add a limit on domain
- [ ] add screenshot option