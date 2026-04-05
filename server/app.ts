import express from 'express'
import cors from 'cors'
import { optionalAuth } from './middleware/auth.js'
import { healthRouter } from './routes/health.js'
import { cvRouter } from './routes/cv.js'
import { analyseRouter } from './routes/analyse.js'
import { jdRouter } from './routes/jd.js'
import { exportRouter } from './routes/export.js'
import { usageRouter } from './routes/usage.js'
import { trackerRouter } from './routes/tracker.js'
import { notesRouter } from './routes/notes.js'
import { jobSearchRouter } from './routes/job-search.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(optionalAuth)

  app.use('/api', healthRouter)
  app.use('/api', cvRouter)
  app.use('/api', analyseRouter)
  app.use('/api', jdRouter)
  app.use('/api', exportRouter)
  app.use('/api', usageRouter)
  app.use('/api', trackerRouter)
  app.use('/api', notesRouter)
  app.use('/api', jobSearchRouter)

  return app
}
