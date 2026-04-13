import { createClient } from '@libsql/client'

export function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
}
