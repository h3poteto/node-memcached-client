import Memcached, { Connection, Metadata } from '@/index'

describe('connection', () => {
  let client: Memcached
  let conn: Connection
  beforeEach(async () => {
    client = new Memcached('127.0.0.1', 11211)
    conn = await client.connect()
  })

  afterEach(async () => {
    await client.close()
  })

  describe('set', () => {
    it('should be setted', async () => {
      const code = await conn.set('test_key', 'hoge', false, 0)
      expect(code).toEqual('STORED')
    })
  })

  describe('get', () => {
    it('should get a key', async () => {
      await conn.set('test_key', 'hoge', false, 0)
      await conn.set('test_key_2', 'fuga', false, 0)
      const data: { [key: string]: Metadata } = await conn.get('test_key')
      expect(data['test_key'].value).toEqual('hoge')
    })

    it('should get multiple keys', async () => {
      const data: { [key: string]: Metadata } = await conn.get('test_key', 'test_key_2')
      expect(data['test_key'].value).toEqual('hoge')
      expect(data['test_key_2'].value).toEqual('fuga')
    })
  })

  describe('delete', () => {
    it('should be deleted', async () => {
      await conn.set('test_key', 'hoge', false, 0)
      const code = await conn.delete('test_key')
      expect(code).toEqual('DELETED')
    })
  })
})
