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
      const data: { [key: string]: Metadata } = await conn.get('test_key')
      expect(data['test_key'].value).toEqual('hoge')
    })

    it('should get multiple keys', async () => {
      await conn.set('test_key', 'hoge', false, 0)
      await conn.set('test_key_2', 'fuga', false, 0)
      const data: { [key: string]: Metadata } = await conn.get('test_key', 'test_key_2')
      expect(data['test_key'].value).toEqual('hoge')
      expect(data['test_key_2'].value).toEqual('fuga')
    })

    it('key does not exist', async () => {
      const data = await conn.get('not_exist_key')
      expect(data['not_exist_key']).toEqual(undefined)
    })
  })

  describe('delete', () => {
    it('should be deleted', async () => {
      await conn.set('test_key', 'hoge', false, 0)
      const code = await conn.delete('test_key')
      expect(code).toEqual('DELETED')
    })
  })

  describe('multiple set', () => {
    it('should be setted', async () => {
      conn
        .set('test_key_1', 'hoge', false, 0)
        .then(code => {
          expect(code).toEqual('STORED')
        })
        .catch(err => expect(err).toBeNull())
      conn
        .set('test_key_2', 'hoge', false, 0)
        .then(code => {
          expect(code).toEqual('STORED')
        })
        .catch(err => expect(err).toBeNull())
      conn
        .set('test_key_3', 'hoge', false, 0)
        .then(code => {
          expect(code).toEqual('STORED')
        })
        .catch(err => expect(err).toBeNull())
      // We have to wait to all promise calling are finished.
      await conn.set('test_key_4', 'hoge', false, 0)
    })
  })

  describe('multiple set and get', () => {
    it('should get', async () => {
      conn.set('test_key', 'hoge', false, 0).then(code => {
        expect(code).toEqual('STORED')
      })
      conn
        .get('test_key')
        .then(data => expect(data['test_key'].value).toEqual('hoge'))
        .catch(err => expect(err).toBeNull())
      conn.set('test_key', 'fuga', false, 0).then(code => {
        expect(code).toEqual('STORED')
      })
      conn
        .get('test_key')
        .then(data => expect(data['test_key'].value).toEqual('fuga'))
        .catch(err => expect(err).toBeNull())
      conn.set('test_key', 'hogehoge', false, 0).then(code => {
        expect(code).toEqual('STORED')
      })
      conn
        .get('test_key')
        .then(data => expect(data['test_key'].value).toEqual('hogehoge'))
        .catch(err => expect(err).toBeNull())
      // We have to wait to all promise calling are finished.
      const data = await conn.get('test_key')
      expect(data['test_key'].value).toEqual('hogehoge')
    })
  })
})
