/**
 * Session caching to reduce auth calls
 */

import { auth } from '@/auth'

let sessionCache: any = null
let cacheTime = 0
const CACHE_TTL = 60000 // 1 minute

export async function getCachedSession() {
  const now = Date.now()
  
  if (sessionCache && (now - cacheTime) < CACHE_TTL) {
    return sessionCache
  }
  
  sessionCache = await auth()
  cacheTime = now
  
  return sessionCache
}

export function clearSessionCache() {
  sessionCache = null
  cacheTime = 0
}