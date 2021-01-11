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

`npm start -- --url https://www.epfl.ch --limit epfl.ch --report --no-screenshot`

### Options

| arg   | full                      | description                     | default  |
| ----- | ------------------------- | ------------------------------- | -------- |
| `-l`  | `--limit <domain>`        | limit to a specific domain      | false    |
| `-ns` | `--no-screenshot`         | save screenshot of visited site | false    |
| `-o`  | `--dump-options`          | dump run time options           | false    |
| `-p`  | `--performance`           | show performance data           | true     |
| `-q`  | `--quiet`                 | limit ouptut console            | false    |
| `-r`  | `--report`                | output final report             | false    |
| `-t`  | `--timeout <timeout>`     | set timeout in milliseconds     | 30000    |
| `-u`  | `--url <url>`             | `url` to start with             | required |
| `-ua` | `--useragent <useragent>` | set useragent                   | default  |
