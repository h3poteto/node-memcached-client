import * as net from 'net'
import { EventEmitter } from 'events'
import { multipleDataParser, Metadata, parseCode, ResponseCode } from './parser'

export class Connection extends EventEmitter {
  public host: string
  public port: number
  public timeout: number
  private _socket: net.Socket | null
  private _connectionClosed: boolean
  private _reconnectInterval: number

  constructor(host: string, port: number, timeout: number) {
    super()

    this.host = host
    this.port = port
    this.timeout = timeout
    this._socket = null
    this._connectionClosed = false
    this._reconnectInterval = 1000
  }

  public connect() {
    const connectOptions: net.NetConnectOpts = {
      host: this.host,
      port: this.port,
      timeout: this.timeout
    }
    this._socket = net.connect(connectOptions)
    this._connectionClosed = false

    this._socket.on('error', () => this.emit('error'))
    this._socket.on('timeout', () => this.emit('timeout'))
    this._socket.on('connect', () => this._handleConnect())
    this._socket.on('close', () => this._handleClose())
  }

  public close() {
    return new Promise(resolve => {
      this._connectionClosed = true
      if (this._socket) {
        this._socket.removeAllListeners('error')
        this._socket.removeAllListeners('timeout')
        this._socket.removeAllListeners('connect')
        this._socket.removeAllListeners('close')

        this._socket.end()
        this._socket = null
      }
      resolve()
    })
  }

  private _handleClose() {
    if (this._connectionClosed) {
      this.emit('close')
    } else {
      this._reconnect()
    }
  }

  private _handleConnect() {
    this.emit('connected')
  }

  private _reconnect() {
    if (this._socket) {
      setTimeout(() => {
        console.warn('reconnecting...')
        this.connect()
      }, this._reconnectInterval)
    }
  }

  private _exec(commands: Array<string>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (!this._socket) {
        const err = new ConnectionLost('connection is null')
        return reject(err)
      }
      const readData = (chunk: Buffer) => {
        this._socket!.removeListener('data', readData)
        resolve(chunk)
      }
      this._socket.on('data', readData)
      commands.map(command => {
        this._socket!.write(Buffer.from(command, 'utf8'))
        this._socket!.write('\r\n')
      })
    })
  }

  public get(...keys: Array<string>): Promise<{ [key: string]: Metadata }> {
    return new Promise((resolve, reject) => {
      const command = `get ${keys.join(' ')}`
      this._exec([command])
        .then(buffer => {
          const code = parseCode(buffer)
          switch (code) {
            case ResponseCode.ERROR:
            case ResponseCode.SERVER_ERROR:
            case ResponseCode.CLIENT_ERROR:
              return reject(code)
            default:
              return resolve(multipleDataParser(buffer))
          }
        })
        .catch(err => reject(err))
    })
  }

  public set(key: string, value: string, isCompress: boolean = false, expires: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      const byteSize = Buffer.byteLength(value, 'utf8')
      const command = `set ${key} ${isCompress ? 1 : 0} ${expires} ${byteSize}`
      this._exec([command, value])
        .then(chunk => {
          const code = parseCode(chunk)
          switch (code) {
            case ResponseCode.EXISTS:
            case ResponseCode.STORED:
            case ResponseCode.NOT_STORED:
              return resolve(code)
            default:
              return reject(chunk.toString())
          }
        })
        .catch(err => reject(err))
    })
  }

  public delete(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = `delete ${key}`
      this._exec([command])
        .then(chunk => {
          const code = parseCode(chunk)
          switch (code) {
            case ResponseCode.DELETED:
              return resolve(code)
            default:
              return reject(chunk.toString())
          }
        })
        .catch(err => reject(err))
    })
  }
}

export class ConnectionLost extends Error {}
