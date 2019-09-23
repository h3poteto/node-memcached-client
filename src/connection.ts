import * as net from 'net'
import { EventEmitter } from 'events'
import { singleDataParser, Metadata, parseCode } from './parser'

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
    console.info('closed')
    if (!this._connectionClosed) {
      this.reconnect()
    }
  }

  private _handleConnect() {
    console.info('connected')
    this.emit('connected')
  }

  private reconnect() {
    if (this._socket) {
      setTimeout(() => {
        console.warn('reconnecting...')
        this.connect()
      }, this._reconnectInterval)
    }
  }

  public get(key: string): Promise<Metadata | null> {
    return new Promise((resolve, reject) => {
      const command = `get ${key}`
      if (!this._socket) {
        const err = new ConnectionLost('connection is null')
        reject(err)
        return
      }
      const readData = (chunk: Buffer) => {
        this._socket!.removeListener('data', readData)
        const code = parseCode(chunk)
        switch (code) {
          case ResponseCode.ERROR:
          case ResponseCode.SERVER_ERROR:
          case ResponseCode.CLIENT_ERROR:
            return reject(code)
          case ResponseCode.END:
            return resolve(null)
          default:
            const data = singleDataParser(chunk)
            return resolve(data)
        }
      }
      this._socket.on('data', readData)
      this._socket.write(Buffer.from(command, 'utf8'))
      this._socket.write('\r\n')
    })
  }

  public set(key: string, value: string, isCompress: boolean = false, expires: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._socket) {
        const err = new ConnectionLost('connection is null')
        return reject(err)
      }
      const byteSize = Buffer.byteLength(value, 'utf8')
      const command = `set ${key} ${isCompress ? 1 : 0} ${expires} ${byteSize}`

      const readData = (chunk: Buffer) => {
        this._socket!.removeAllListeners('data')
        const code = parseCode(chunk)
        switch (code) {
          case ResponseCode.EXISTS:
          case ResponseCode.STORED:
          case ResponseCode.NOT_STORED:
            resolve(code)
            return
          default:
            reject(chunk.toString())
            return
        }
      }
      this._socket.on('data', readData)
      this._socket.write(Buffer.from(command, 'utf8'))
      this._socket.write('\r\n')
      this._socket.write(Buffer.from(value, 'utf8'))
      this._socket.write('\r\n')
    })
  }

  public delete(key: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._socket) {
        const err = new ConnectionLost('connection is null')
        return reject(err)
      }
      const command = `delete ${key}`
      const readData = (chunk: Buffer) => {
        this._socket!.removeListener('data', readData)
        const code = parseCode(chunk)
        switch (code) {
          case ResponseCode.DELETED:
            return resolve(code)
          default:
            return reject(chunk.toString())
        }
      }
      this._socket.on('data', readData)
      this._socket.write(Buffer.from(command, 'utf8'))
      this._socket.write('\r\n')
    })
  }
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

export class ConnectionLost extends Error {
  constructor(msg: string) {
    super(msg)
  }
}
