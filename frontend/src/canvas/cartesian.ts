/**
 * cartesian.ts
 * ------------
 * 2D Cartesian plane.
 */

import type { Position } from '@/types/simulation'
import { drawCircle } from './utils'

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

interface CartesianContext {
    x: number
    y: number
    width: number
    height: number
    cx: number
    cy: number
    scaleX: number
    scaleY: number
}

// Helper to convert simulation coordinates -> canvas
const toCanvas = (c: CartesianContext, sx: number, sy: number): [number, number] => [
    c.cx + sx * c.scaleX,
    c.cy - sy * c.scaleY // Invertir Y (positivo = arriba)
]

const drawBackground = (ctx: CanvasRenderingContext2D, c: CartesianContext) => {
    const bgGrad = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.height)
    bgGrad.addColorStop(0, '#0f1117')
    bgGrad.addColorStop(1, '#080b10')

    ctx.fillStyle = bgGrad
    ctx.fillRect(c.x, c.y, c.width, c.height)

    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.width - 1, c.height - 1)
}

const drawGrid = (ctx: CanvasRenderingContext2D, c: CartesianContext) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5

    ctx.beginPath()

    for (let gx = -15; gx <= 15; gx += 5) {
        const [px] = toCanvas(c, gx, 0)
        ctx.moveTo(px, c.y)
        ctx.lineTo(px, c.y + c.height)
    }

    for (let gy = -15; gy <= 15; gy += 5) {
        const [, py] = toCanvas(c, 0, gy)
        ctx.moveTo(c.x, py)
        ctx.lineTo(c.x + c.width, py)
    }
    ctx.stroke()
}

const drawSafeZone = (ctx: CanvasRenderingContext2D, c: CartesianContext) => {
    const safeRadius = 5 * Math.min(c.scaleX, c.scaleY)

    drawCircle(ctx, c.cx, c.cy, safeRadius, 'rgba(67, 180, 100, 0.07)')

    ctx.lineWidth = 1
    drawCircle(ctx, c.cx, c.cy, safeRadius, 'rgba(67, 180, 100, 0.35)', true)
}

const drawAxesAndLabels = (ctx: CanvasRenderingContext2D, c: CartesianContext) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.20)'
    ctx.lineWidth = 1

    ctx.beginPath()
    ctx.moveTo(c.x + c.width * 0.05, c.cy)
    ctx.lineTo(c.x + c.width * 0.95, c.cy)
    ctx.moveTo(c.cx, c.y + c.height * 0.05)
    ctx.lineTo(c.cx, c.y + c.height * 0.95)
    ctx.stroke()

    const minDim = Math.min(c.width, c.height)

    ctx.font = `bold ${minDim * 0.05}px 'Inter', sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.textBaseline = 'middle'

    ctx.textAlign = 'left'
    ctx.fillText('X+', c.x + c.width * 0.88, c.cy - c.height * 0.04)
    ctx.textAlign = 'center'
    ctx.fillText('Y+', c.cx + c.width * 0.04, c.y + c.height * 0.07)

    ctx.font = `${minDim * 0.035}px monospace`
    ctx.fillStyle = 'rgba(255,255,255,0.18)'

    for (const v of [-15, -10, -5, 5, 10, 15]) {
        const [px] = toCanvas(c, v, 0)
        ctx.textAlign = 'center'
        ctx.fillText(v.toString(), px, c.cy + c.height * 0.045)

        const [, py] = toCanvas(c, 0, v)
        ctx.textAlign = 'right'
        ctx.fillText(v.toString(), c.cx - c.width * 0.015, py)
    }
}

const drawTrail = (ctx: CanvasRenderingContext2D, c: CartesianContext) => {
    if (trail.length < 2) return

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (let i = 1; i < trail.length; i++) {
        const progress = i / trail.length
        const alpha = progress * progress * 0.7

        const [x0, y0] = toCanvas(c, trail[i - 1].x, trail[i - 1].y)
        const [x1, y1] = toCanvas(c, trail[i].x, trail[i].y)

        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.strokeStyle = `rgba(79, 152, 163, ${alpha})`
        ctx.lineWidth = 2 * progress
        ctx.stroke()
    }
}

const drawAirplaneDot = (ctx: CanvasRenderingContext2D, c: CartesianContext, pos: Position) => {
    const [dotX, dotY] = toCanvas(c, pos.x, pos.y)
    const dotRadius = Math.min(c.width, c.height) * 0.025

    const glowLayers = [
        { r: dotRadius * 4.0, alpha: 0.06 },
        { r: dotRadius * 2.5, alpha: 0.15 },
        { r: dotRadius * 1.5, alpha: 0.30 }
    ]

    for (const layer of glowLayers) {
        drawCircle(ctx, dotX, dotY, layer.r, `rgba(79, 152, 163, ${layer.alpha})`)
    }

    const dotGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, dotRadius)
    dotGrad.addColorStop(0, '#ffffff')
    dotGrad.addColorStop(0.4, '#7fccd6')
    dotGrad.addColorStop(1, '#4f98a3')

    drawCircle(ctx, dotX, dotY, dotRadius, dotGrad)
}

const drawTitle = (ctx: CanvasRenderingContext2D, c: CartesianContext) => {
    ctx.font = `bold ${Math.min(c.width, c.height) * 0.05}px 'Inter', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('POSITION / TRAIL', c.x + c.width * 0.04, c.y + c.height * 0.03)
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

    const cContext: CartesianContext = {
        x, y, width, height,
        cx: x + width / 2,
        cy: y + height / 2,
        scaleX: (width * 0.9) / 30,
        scaleY: (height * 0.9) / 30
    }

    drawBackground(ctx, cContext)
    drawGrid(ctx, cContext)
    drawSafeZone(ctx, cContext)
    drawAxesAndLabels(ctx, cContext)
    drawTrail(ctx, cContext)
    drawAirplaneDot(ctx, cContext, pos)
    drawTitle(ctx, cContext)

    ctx.restore()
}