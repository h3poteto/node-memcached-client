import { EventEmitter } from 'events'
import { Connection } from './connection'

export type Options = {
  timeout: number
}

const defaultOptions: Options = {
  timeout: 10000
}

export class Memcached extends EventEmitter {
  public host: string
  public port: number
  public options: Options
  private connection: Connection | null

  constructor(host: string, port: number, options: Options | null) {
    super()
    this.host = host
    this.port = port
    this.connection = null
    if (options) {
      this.options = options
    } else {
      this.options = defaultOptions
    }
  }

  public connect(): Promise<Connection> {
    return new Promise(resolve => {
      this.connection = new Connection(this.host, this.port, this.options.timeout)
      this.connection.on('error', () => this.emit('error'))
      this.connection.on('timeout', () => this.emit('timeout'))
      this.connection.on('connected', () => {
        this.emit('connected')
        resolve(this.connection!)
      })
      this.connection.on('close', () => this.emit('close'))
      this.connection.connect()
    })
  }

  public close() {
    if (this.connection) {
      try {
        this.connection.close()
      } catch (err) {
        console.error(err)
      }
    }
  }
}
