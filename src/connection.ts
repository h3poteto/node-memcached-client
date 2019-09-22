import * as net from 'net'
import { EventEmitter } from 'events'
import { singleDataParser, Metadata } from './parser'

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
    this._socket.on('connect', () => this.handleConnect())
    this._socket.on('close', () => this.handleClose())
  }

  public close() {
    this._connectionClosed = true
    if (this._socket) {
      this._socket.end()
      this._socket = null
    }
  }

  private handleClose() {
    console.info('closed')
    if (!this._connectionClosed) {
      this.reconnect()
    }
  }

  private handleConnect() {
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

  public get(key: string): Promise<Metadata> {
    return new Promise((resolve, reject) => {
      const command = `get ${key}`
      if (!this._socket) {
        const err = new ConnectionLost('connection is null')
        reject(err)
        return
      }
      const readData = (chunk: Buffer) => {
        const data = singleDataParser(chunk)
        this._socket!.removeListener('data', readData)
        resolve(data)
      }
      this._socket.on('data', readData)
      this._socket.write(Buffer.from(command, 'utf8'))
      this._socket.write('\r\n')
    })
  }
}

export class ConnectionLost extends Error {
  constructor(msg: string) {
    super(msg)
  }
}
