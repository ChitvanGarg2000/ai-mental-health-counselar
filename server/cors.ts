import type { Express, Request, Response, NextFunction } from 'express'

/**
 * Allow exactly one browser origin (FRONTEND_ORIGIN). No wildcard — conversation traffic
 * should not be readable from arbitrary sites.
 */
export function corsForFrontend(app: Express, frontendOrigin: string) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin

    if (origin === frontendOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(origin === frontendOrigin ? 204 : 403)
      return
    }

    next()
  })
}
