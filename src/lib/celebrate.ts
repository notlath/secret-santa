import confetti from "canvas-confetti"

const COLORS = ["#9e1b32", "#1f4d3a", "#b8862b", "#f3eadb"]

// Two side bursts from the activated control. Callers invoke it only for pointer activation.
export function celebrate(from: HTMLElement) {
  const box = from.getBoundingClientRect()
  const x = (box.left + box.width / 2) / window.innerWidth
  const y = (box.top + box.height / 2) / window.innerHeight
  const base = { particleCount: 80, spread: 70, startVelocity: 55, colors: COLORS, disableForReducedMotion: true, ticks: 180 }
  confetti({ ...base, angle: 60, origin: { x: Math.max(0, x - 0.15), y } })
  confetti({ ...base, angle: 120, origin: { x: Math.min(1, x + 0.15), y } })
}
