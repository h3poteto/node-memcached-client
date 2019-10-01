export type Metadata = {
  key: string
  flags: number
  bytes: number
  value: string
}

enum ResponseCode {
  END = 'END',
  STORED = 'STORED',
  NOT_STORED = 'NOT_STORED',
  NOT_FOUND = 'NOT_FOUND',
  EXISTS = 'EXISTS',
  DELETED = 'DELETED',
  TOUCHED = 'TOUCHED',
  ERROR = 'ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
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

const multipleDataParser = (buffer: Buffer) => {
  let base = 0
  let metadata: { [key: string]: Metadata } = {}

  do {
    let start = buffer.indexOf('\r\n', base)
    const meta = buffer
      .slice(base, start)
      .toString('utf8')
      .split(' ')
    start += '\r\n'.length
    if (meta[0] === ResponseCode.END) {
      break
    }
    const value = buffer.slice(start, start + parseInt(meta[3], 10))
    metadata[meta[1]] = {
      key: meta[1],
      flags: parseInt(meta[2], 10),
      bytes: parseInt(meta[3], 10),
      value: value.toString('utf8')
    }
    base = start + parseInt(meta[3]) + '\r\n'.length
  } while (true)
  return metadata
}

const parseCode = (buffer: Buffer) => {
  const str = buffer.toString()
  const justMatch = str.match(/^[A-Z_]+\r\n$/)
  if (justMatch) {
    return justMatch[0].replace(/\r\n$/, '')
  }
  const tailMatch = str.match(/\r\n[A-Z_]+\r\n$/)
  if (tailMatch) {
    return tailMatch[0].replace(/\r\n/g, '')
  }
  return new Error('does not match')
}

const endResponse = (buffer: Buffer): boolean => {
  const code = parseCode(buffer)
  switch (code) {
    case ResponseCode.STORED:
    case ResponseCode.NOT_STORED:
    case ResponseCode.NOT_FOUND:
    case ResponseCode.ERROR:
    case ResponseCode.EXISTS:
    case ResponseCode.TOUCHED:
    case ResponseCode.DELETED:
    case ResponseCode.END:
      return true
    default:
      return false
  }
}

export { singleDataParser, multipleDataParser, parseCode, endResponse, ResponseCode }
