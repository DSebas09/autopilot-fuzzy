import type { Position } from '@/types/simulation'
const TRAIL_LENGTH = 60

const trail: Position[] = []
export function updateTrail(pos: Position): void {
    trail.push({ x: pos.x, y: pos.y })
    if (trail.length > TRAIL_LENGTH) {
        trail.shift()
    }
}

export function clearTrail(): void {
    trail.length = 0
}

export function drawCartesian(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    pos: Position
): void {
    ctx.save()

    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()

    const bgGrad = ctx.createLinearGradient(x, y, x, y + height)
    bgGrad.addColorStop(0, '#0f1117')
    bgGrad.addColorStop(1, '#080b10')

    ctx.fillStyle = bgGrad
    ctx.fillRect(x, y, width, height)

    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)

    const cx = x + width  / 2
    const cy = y + height / 2

    const scaleX = (width  * 0.9) / 30
    const scaleY = (height * 0.9) / 30

    function toCanvas(sx: number, sy: number): [number, number] {
        return [
            cx + sx * scaleX,
            cy - sy * scaleY
        ]
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5

    for (let gx = -15; gx <= 15; gx += 5) {
        const [px] = toCanvas(gx, 0)
        ctx.beginPath()
        ctx.moveTo(px, y)
        ctx.lineTo(px, y + height)
        ctx.stroke()
    }

    for (let gy = -15; gy <= 15; gy += 5) {
        const [, py] = toCanvas(0, gy)
        ctx.beginPath()
        ctx.moveTo(x, py)
        ctx.lineTo(x + width, py)
        ctx.stroke()
    }

    const safeRadius = 5 * Math.min(scaleX, scaleY)

    ctx.beginPath()
    ctx.arc(cx, cy, safeRadius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(67, 180, 100, 0.07)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(cx, cy, safeRadius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(67, 180, 100, 0.35)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255,255,255,0.20)'
    ctx.lineWidth = 1

    ctx.beginPath()
    ctx.moveTo(x + width * 0.05, cy)
    ctx.lineTo(x + width * 0.95, cy)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(cx, y + height * 0.05)
    ctx.lineTo(cx, y + height * 0.95)
    ctx.stroke()

    ctx.font = `bold ${Math.min(width, height) * 0.055}px monospace`
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.textBaseline = 'middle'

    ctx.textAlign = 'left'
    ctx.fillText('X+', x + width * 0.88, cy - height * 0.04)

    ctx.textAlign = 'center'
    ctx.fillText('Y+', cx + width * 0.04, y + height * 0.07)

    ctx.font = `${Math.min(width, height) * 0.04}px monospace`
    ctx.fillStyle = 'rgba(255,255,255,0.18)'

    for (const v of [-15, -10, -5, 5, 10, 15]) {
        const [px] = toCanvas(v, 0)
        ctx.textAlign = 'center'
        ctx.fillText(v.toString(), px, cy + height * 0.045)

        const [, py] = toCanvas(0, v)
        ctx.textAlign = 'right'
        ctx.fillText(v.toString(), cx - width * 0.015, py)
    }

    if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
            const progress = i / trail.length          // 0 → más antiguo, 1 → más reciente
            const alpha    = progress * progress * 0.7 // fade cuadrático

            const [x0, y0] = toCanvas(trail[i - 1].x, trail[i - 1].y)
            const [x1, y1] = toCanvas(trail[i].x,     trail[i].y)

            ctx.beginPath()
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y1)
            ctx.strokeStyle = `rgba(79, 152, 163, ${alpha})`
            ctx.lineWidth   = 1.5 * progress
            ctx.stroke()
        }
    }

    const [dotX, dotY] = toCanvas(pos.x, pos.y)
    const dotRadius    = Math.min(width, height) * 0.025

    const glowLayers = [
        { r: dotRadius * 4.0, alpha: 0.06 },
        { r: dotRadius * 2.5, alpha: 0.15 },
        { r: dotRadius * 1.5, alpha: 0.30 },
    ]

    for (const { r, alpha } of glowLayers) {
        ctx.beginPath()
        ctx.arc(dotX, dotY, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(79, 152, 163, ${alpha})`
        ctx.fill()
    }

    const dotGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotRadius)
    dotGrad.addColorStop(0, '#ffffff')
    dotGrad.addColorStop(0.4, '#7fccd6')
    dotGrad.addColorStop(1, '#4f98a3')

    ctx.beginPath()
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
    ctx.fillStyle = dotGrad
    ctx.fill()

    ctx.font = `bold ${Math.min(width, height) * 0.055}px monospace`
    ctx.fillStyle = 'rgba(255,255,255,0.30)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('POSITION', x + width * 0.04, y + height * 0.03)

    ctx.restore()
}