# node-memcached-client
[![Build Status](https://travis-ci.com/h3poteto/node-memcached-client.svg?branch=master)](https://travis-ci.com/h3poteto/node-memcached-client)
[![npm](https://img.shields.io/npm/v/memcached-client)](https://www.npmjs.com/package/memcached-client)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/h3poteto/node-memcached-client)](https://github.com/h3poteto/node-memcached-client/releases)

A Memcached client library for node.js. This library written in typescript and define promisified methods.

## Install
```
$ npm install memcached-client
```

or

```
$ yarn add memcached-client
```

## Usage

```typescript
import Memcached, { Metadata } from 'memcached-client'

// Connect to your memcached server.
const client = new Memcached('127.0.0.1', 11211)

const example = async (client: Memcached) => {
  const connection = await client.connect()
  const code = await connection.set('my-key', 'my-value', false, 0)
  console.log(code) // => STORED
  const data: { [key: string]: Metadata } = await connection.get('my-key')
  if (data['my-key']) {
    console.log(data['my-key'].value) // => my-value
  }
  await connection.close()
}

```

And I prepared some [examples](example).


## Roadmap
This library does not yet cover all memcached methods. But I will implement all methods.

| memcached-client version | v0.1.x  |
|--------------------------|---------|
| get                      | ✔       |
| set                      | ✔       |
| delete                   | ✔       |
| gets                     | not yet |
| cas                      | not yet |
| replace                  | not yet |
| append                   | not yet |
| prepend                  | not yet |
| incr/decr                | not yet |



## License
The software is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
