'use client'

// Map country code to emoji flag
function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌊'
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('')
}

export function CountryFlag({ code, label }: { code: string | null; label: string }) {
  if (!code) return <span className="text-2xl">🌊</span>
  return (
    <span className="flex items-center gap-2">
      <span className="text-2xl">{countryCodeToFlag(code)}</span>
      <span className="text-sm opacity-70">{label}</span>
    </span>
  )
}
