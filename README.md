# RCC — Reload Cloudflare Cache

## Goal

Screenshot all linked pages from a given URL, in order to unsure that Cloudflare
will cache them all.

Our cloudflare's cache configuration is set to expire in less tham 15 minutes,
but in case of a long maintenance of our website we want to rely on cloudflare
to serve our pages from cache for a longer period. Once the cloudflare
configuration is changed, we needed a way to query all our URLs to be sure that
they will be cached in cloudflare service.