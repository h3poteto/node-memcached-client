import Memcached, { Connection, Metadata } from '@/index'

describe('set', () => {
  it('should be setted', async () => {
    const client = new Memcached('127.0.0.1', 11211)
    const conn: Connection = await client.connect()
    const code = await conn.set('test_key', 'hoge', false, 0)
    expect(code).toEqual('STORED')
    await client.close()
  })
})

describe('get', () => {
  it('should get', async () => {
    const client = new Memcached('127.0.0.1', 11211)
    const conn: Connection = await client.connect()
    await conn.set('test_key', 'hoge', false, 0)
    const data: Metadata | null = await conn.get('test_key')
    expect(data).not.toBeNull
    expect(data!.value).toEqual('hoge')
    await client.close()
  })
})

describe('delete', () => {
  it('should be deleted', async () => {
    const client = new Memcached('127.0.0.1', 11211)
    const conn: Connection = await client.connect()
    await conn.set('test_key', 'hoge', false, 0)
    const code = await conn.delete('test_key')
    expect(code).toEqual('DELETED')
    await client.close()
  })
})
