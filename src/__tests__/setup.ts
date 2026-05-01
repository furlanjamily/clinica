import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

const app = next({ dev: true })
const handle = app.getRequestHandler()

export async function startServer() {
  await app.prepare()
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })
  return new Promise<{ server: any; port: number }>((resolve, reject) => {
    server.listen(0, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to resolve server port'))
        return
      }
      resolve({ server, port: address.port })
    })
    server.on('error', reject)
  })
}