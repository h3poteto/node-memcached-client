import { singleDataParser, multipleDataParser, parseCode } from '@/parser'

describe('parser', () => {
  describe('singleDataParser', () => {
    it('should get metadata', () => {
      const chunk = Buffer.from('VALUE hoge 0 3\r\nbar\r\nEND\r\n')
      const res = singleDataParser(chunk)
      expect(res.key).toEqual('hoge')
      expect(res.value).toEqual('bar')
    })
  })

  describe('multipleDataParser', () => {
    it('should get metadata', () => {
      const chunk = Buffer.from('VALUE hoge 0 3\r\nbar\r\nVALUE fuga 0 8\r\nfugafuga\r\nEND\r\n')
      const res = multipleDataParser(chunk)
      expect(res['hoge'].key).toEqual('hoge')
      expect(res['hoge'].value).toEqual('bar')
      expect(res['fuga'].key).toEqual('fuga')
      expect(res['fuga'].value).toEqual('fugafuga')
    })
  })

  describe('parseCode', () => {
    it('only code should match', () => {
      const chunk = Buffer.from('STORED\r\n')
      const code = parseCode(chunk)
      expect(code).toEqual('STORED')
    })

    it('contains some values should match', () => {
      const chunk = Buffer.from('VALUE hoge 0 3\r\nbar\r\nVALUE fuga 0 8\r\nfugafuga\r\nEND\r\n')
      const code = parseCode(chunk)
      expect(code).toEqual('END')
    })
  })
})
