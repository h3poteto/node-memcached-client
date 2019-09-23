# node-memcached-client

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
  const data: Metadata | null = await connection.get('my-key')
  if (data) {
    console.log(data.value) // => my-value
  }
  await connection.close()
}

```

And I prepared some [examples](example).


## License
The software is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).
