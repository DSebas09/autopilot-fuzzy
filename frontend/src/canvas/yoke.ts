/**
 * yoke.ts
 * -------
 Airplane steering wheel/yoke
 */

import {drawCircle} from './utils'

const PITCH_DISPLACEMENT = 0.25 // fraction of the height of the area per unit max of pitch
const ROLL_ROTATION_MAX = 40    // Maximum degrees of visual rotation

interface YokeContext {
    cx: number
    cy: number
    size: number
    panelR: number
    pitchOffset: number
    rollAngle: number
    ux: number
    uy: number
}

const drawStem = (ctx: CanvasRenderingContext2D, y: YokeContext) => {
    const stemH = y.size * 0.55
    const stemTopY = y.cy - y.size * 0.05 + y.pitchOffset
    const stemBotY = y.cy + stemH * 0.9

    const stemGrad = ctx.createLinearGradient(y.cx - y.size * 0.06, 0, y.cx + y.size * 0.06, 0)
    stemGrad.addColorStop(0, '#1a1a1a')
    stemGrad.addColorStop(0.3, '#4a4a4a')
    stemGrad.addColorStop(0.7, '#3a3a3a')
    stemGrad.addColorStop(1, '#111')

    ctx.beginPath()
    ctx.roundRect(y.cx - y.size * 0.055, stemTopY, y.size * 0.11, stemBotY - stemTopY, y.size * 0.04)
    ctx.fillStyle = stemGrad
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(y.cx, stemTopY + y.size * 0.06)
    ctx.lineTo(y.cx, stemBotY - y.size * 0.04)
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.lineWidth = 1
    ctx.stroke()
}

const drawWheel = (ctx: CanvasRenderingContext2D, y: YokeContext) => {
    const yokeW = y.size
    const yokeH = y.size * 0.55
    const armW = yokeW * 0.42
    const gripW = y.size * 0.13
    const gripH = yokeH * 0.60
    const wheelR = yokeH * 0.42

    ctx.save()
    ctx.translate(y.cx, y.cy - yokeH * 0.1 + y.pitchOffset)
    ctx.rotate(y.rollAngle)

    ctx.fillStyle = '#2e2e35'

    ctx.beginPath()
    ctx.roundRect(-armW - gripW / 2, -yokeH * 0.15, armW, y.size * 0.11, y.size * 0.04)
    ctx.fill()

    ctx.beginPath()
    ctx.roundRect(gripW / 2, -yokeH * 0.15, armW, y.size * 0.11, y.size * 0.04)
    ctx.fill()

    const makeGripGrad = (gx: number) => {
        const g = ctx.createLinearGradient(gx - gripW, 0, gx + gripW, 0)
        g.addColorStop(0, '#222')
        g.addColorStop(0.4, '#3d3d44')
        g.addColorStop(1, '#1a1a1e')
        return g
    }

    ctx.beginPath()
    ctx.roundRect(-armW - gripW * 1.1, -gripH / 2, gripW * 1.4, gripH, y.size * 0.06)
    ctx.fillStyle = makeGripGrad(-armW)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.roundRect(armW - gripW * 0.3, -gripH / 2, gripW * 1.4, gripH, y.size * 0.06)
    ctx.fillStyle = makeGripGrad(armW)
    ctx.fill()
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 0.8
    for (let i = -3; i <= 3; i++) {
        const gy = (i / 3) * gripH * 0.35
        ctx.beginPath()
        ctx.moveTo(-armW - gripW * 1.0, gy)
        ctx.lineTo(-armW + gripW * 0.2, gy)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(armW - gripW * 0.2, gy)
        ctx.lineTo(armW + gripW * 1.1, gy)
        ctx.stroke()
    }

    const hubGrad = ctx.createRadialGradient(-wheelR * 0.2, -wheelR * 0.2, 0, 0, 0, wheelR)
    hubGrad.addColorStop(0, '#4a4a52')
    hubGrad.addColorStop(0.6, '#23232a')
    hubGrad.addColorStop(1, '#111')

    drawCircle(ctx, 0, 0, wheelR, hubGrad)

    ctx.lineWidth = 1.5
    drawCircle(ctx, 0, 0, wheelR, 'rgba(255,255,255,0.15)', true)

    drawCircle(ctx, 0, 0, wheelR * 0.45, 'rgba(79, 152, 163, 0.25)')
    ctx.lineWidth = 1
    drawCircle(ctx, 0, 0, wheelR * 0.45, 'rgba(79, 152, 163, 0.60)', true)
    drawCircle(ctx, 0, 0, wheelR * 0.12, '#7fccd6')

    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = y.size * 0.025
    ctx.beginPath()
    ctx.moveTo(-wheelR * 0.85, 0)
    ctx.lineTo(-armW * 0.35, 0)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(wheelR * 0.85, 0)
    ctx.lineTo(armW * 0.35, 0)
    ctx.stroke()

    ctx.restore()
}

const drawActivityIndicator = (ctx: CanvasRenderingContext2D, y: YokeContext) => {
    const magnitude = Math.sqrt(y.ux * y.ux + y.uy * y.uy) / 28.28 // normalizado

    if (magnitude > 0.05) {
        ctx.lineWidth = y.size * 0.06
        drawCircle(ctx, y.cx, y.cy, y.panelR, `rgba(79, 152, 163, ${magnitude * 0.4})`, true)
    }
}

const drawTextAndLabels = (ctx: CanvasRenderingContext2D, y: YokeContext) => {
    const fontSize = y.size * 0.14
    ctx.font = `bold ${fontSize}px monospace`
    ctx.textBaseline = 'bottom'

    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(79, 152, 163, 0.90)' // Color Roll
    ctx.fillText(`UX ${y.ux > 0 ? '+' : ''}${y.ux.toFixed(1)}`, y.cx - y.panelR * 0.75, y.cy + y.panelR * 0.82)

    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(163, 120, 79, 0.90)' // Color Pitch
    ctx.fillText(`UY ${y.uy > 0 ? '+' : ''}${y.uy.toFixed(1)}`, y.cx + y.panelR * 0.75, y.cy + y.panelR * 0.82)

    ctx.font = `bold ${y.size * 0.14}px 'Inter', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.textAlign = 'center'
    ctx.fillText('YOKE / CONTROL', y.cx, y.cy - y.panelR * 0.78)
}

export function drawYoke(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    ux: number,
    uy: number
): void {
    ctx.save()

    const yContext: YokeContext = {
        cx,
        cy,
        size,
        panelR: size * 0.92,
        pitchOffset: -(uy / 20) * size * PITCH_DISPLACEMENT,
        rollAngle: ((ux / 20) * ROLL_ROTATION_MAX * Math.PI) / 180,
        ux,
        uy
    }

    drawStem(ctx, yContext)

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, yContext.panelR, 0, Math.PI * 2)
    ctx.clip()

    drawWheel(ctx, yContext)

    ctx.restore()

    drawActivityIndicator(ctx, yContext)
    drawTextAndLabels(ctx, yContext)

    ctx.restore()
}