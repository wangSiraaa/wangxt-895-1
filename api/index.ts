import type { IncomingMessage, ServerResponse } from 'http'
import app from './app.js'
import { initializeDatabase } from './db/database.js'
import { seed } from './db/seed.js'

const PORT = process.env.PORT || 3000

let dbInitialized = false

async function ensureDbInitialized(): Promise<void> {
  if (dbInitialized) return
  initializeDatabase()
  seed()
  dbInitialized = true
}

type VercelRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>
  cookies?: Record<string, string>
  body?: unknown
}
type VercelResponse = ServerResponse

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDbInitialized()
  return app(req, res)
}

if (process.argv[1] && process.argv[1].includes('api/index')) {
  ;(async () => {
    try {
      console.log('[init] 正在初始化数据库...')
      initializeDatabase()
      console.log('[init] 数据库表结构初始化完成')

      console.log('[init] 正在执行种子数据...')
      seed()
      console.log('[init] 种子数据初始化完成')

      const server = app.listen(Number(PORT), () => {
        console.log(`[server] Server ready on port ${PORT}`)
        console.log(`[server] Health check: http://localhost:${PORT}/api/health`)
      })

      process.on('SIGTERM', () => {
        console.log('SIGTERM signal received')
        server.close(() => {
          console.log('Server closed')
          process.exit(0)
        })
      })

      process.on('SIGINT', () => {
        console.log('SIGINT signal received')
        server.close(() => {
          console.log('Server closed')
          process.exit(0)
        })
      })
    } catch (err) {
      console.error('[init] 服务器启动失败:', err)
      process.exit(1)
    }
  })()
}

export { handler }
