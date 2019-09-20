import * as net from 'net'
import { EventEmitter } from 'events'

export type Options = {}

export class Connection extends EventEmitter {
  private host: string
  private port: number
  private socket: net.Socket | null
  private _connectionClosed: boolean
  private _reconnectInterval: number

  constructor(host: string, port: number) {
    super()

    this.host = host
    this.port = port
    this.socket = null
    this._connectionClosed = false
    this._reconnectInterval = 1000
  }

  public connection() {
    const connectOptions: net.NetConnectOpts = {
      host: this.host,
      port: this.port
    }
    this.socket = net.connect(connectOptions)
    this._connectionClosed = false

    this.socket.on('error', () => this.emit('error'))
    this.socket.on('timeout', () => this.emit('timeout'))
    this.socket.on('connect', () => this.handleConnect())
    this.socket.on('close', () => this.handleClose())
  }

  public close() {
    this._connectionClosed = true
    if (this.socket) {
      this.socket.end()
      this.socket = null
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
    if (this.socket) {
      setTimeout(() => {
        console.warn('reconnecting...')
        this.connection()
      }, this._reconnectInterval)
    }
  }
}
