import { createHash } from 'crypto'

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_SALT || 'swap-pic-salt')).digest('hex')
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export async function getCountryCode(ip: string): Promise<string | null> {
  // Skip for localhost / private IPs
  if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
    return null
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.countryCode || null
  } catch {
    return null
  }
}
