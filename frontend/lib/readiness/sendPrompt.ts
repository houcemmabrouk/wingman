export function sendPrompt(text: string): void {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line no-console
  console.log('[sendPrompt]', text)
  window.dispatchEvent(new CustomEvent('wingman:prompt', { detail: text }))
}
