export interface vURL {
  url: URL
  path: string
  file: string
  info: any
}

export interface report {
  max: {
    url: vURL
    time: number
  }
  min: {
    url: vURL
    time: number
  }
  total: {
    visited: number
    excluded: number
    time: number
    links: number
  }
  average: number
}
