export function safeNextPath(value: string | null, base: string) {
  return value?.startsWith('/') && new URL(value, base).origin === new URL(base).origin ? value : '/'
}
