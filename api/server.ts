import app from './app.js'
import { initializeDatabase } from './db/database.js'
import { seed } from './db/seed.js'

const PORT = process.env.PORT || 3000

async function startServer(): Promise<void> {
  try {
    console.log('[init] 正在初始化数据库...')
    initializeDatabase()
    console.log('[init] 数据库表结构初始化完成')

    console.log('[init] 正在执行种子数据...')
    seed()
    console.log('[init] 种子数据初始化完成')

    const server = app.listen(PORT, () => {
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
}

startServer()

export default app
