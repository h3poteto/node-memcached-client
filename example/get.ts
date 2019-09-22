import Memcached from 'memcached-client'

const client = new Memcached('127.0.0.1', 11211)

client.connect().then(connection => {
  connection.get('hoge').then(data => {
    if (!data) {
      console.log('nothing')
    } else {
      console.log(data.value)
    }
  })
})
