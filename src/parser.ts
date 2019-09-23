export type Metadata = {
  key: string
  flags: number
  bytes: number
  value: string
}

const singleDataParser = (buffer: Buffer) => {
  let start = buffer.indexOf('\r\n')
  const meta = buffer
    .slice(0, start)
    .toString('utf8')
    .split(' ')
  start += '\r\n'.length
  const value = buffer.slice(start, start + parseInt(meta[3], 10))
  const metadata: Metadata = {
    key: meta[1],
    flags: parseInt(meta[2], 10),
    bytes: parseInt(meta[3], 10),
    value: value.toString('utf8')
  }
  return metadata
}

const parseCode = (buffer: Buffer) => {
  const end = Math.min(buffer.length, 14)
  const code = Buffer.alloc(end)
  buffer.copy(code, 0, 0, end)

  return code.toString('utf8').replace(/\r\n$/, '')
}

export { singleDataParser, parseCode }
