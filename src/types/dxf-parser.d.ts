declare module 'dxf-parser' {
  export default class DxfParser {
    parseSync(content: string): any
    parse(content: string, callback: (err: Error | null, result?: any) => void): void
  }
}