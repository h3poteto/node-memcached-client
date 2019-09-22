import Memcached from 'memcached-client'

const client = new Memcached('127.0.0.1', 11211, null)

client.connect().then(connection => {
  connection.get('hoga').then(data => {
    if (!data) {
      console.log('nothing')
    } else {
      console.log(data.value)
    }
  })
})
