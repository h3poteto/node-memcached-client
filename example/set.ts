import Memcached from 'memcached-client'

const client = new Memcached('127.0.0.1', 11211)

client.connect().then(connection => {
  connection.set('hoge', 'akira', false, 0).then(code => console.log(code))
})
