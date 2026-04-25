/**
 * gauge.ts
 * --------
 * Improved analog circular instrument with corrected rotation.
 */

export interface GaugeConfig {
    cx: number
    cy: number
    radius: number
    minVal: number
    maxVal: number
    minAngle: number
    maxAngle: number
    label: string
    accentColor: string
    numMajor?: number
}

interface GaugeContext extends GaugeConfig {
    innerRadius: number
    totalAngle: number
    drawAngleOffset: number
}


/** Converts polar coordinates to Cartesian coordinates */
const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => ({
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
})

/** Draw a basic circle */
const drawCircle = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, style: string | CanvasGradient, isStroke = false) => {
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    if (isStroke) {
        ctx.strokeStyle = style
        ctx.stroke()
    } else {
        ctx.fillStyle = style
        ctx.fill()
    }
}

const drawBezel = (ctx: CanvasRenderingContext2D, g: GaugeContext) => {
    const bevelGrad = ctx.createRadialGradient(
        g.cx - g.radius * 0.3, g.cy - g.radius * 0.3, g.radius * 0.4,
        g.cx, g.cy, g.radius
    )
    bevelGrad.addColorStop(0, '#666666')
    bevelGrad.addColorStop(0.6, '#2a2a2a')
    bevelGrad.addColorStop(1, '#0a0a0a')

    drawCircle(ctx, g.cx, g.cy, g.radius, bevelGrad)

    ctx.lineWidth = 1
    drawCircle(ctx, g.cx, g.cy, g.radius, '#000', true)
}

const drawBackground = (ctx: CanvasRenderingContext2D, g: GaugeContext) => {
    const bgGrad = ctx.createRadialGradient(g.cx, g.cy + g.radius * 0.5, 0, g.cx, g.cy, g.innerRadius)
    bgGrad.addColorStop(0, '#111111')
    bgGrad.addColorStop(1, '#1e1e1e')

    drawCircle(ctx, g.cx, g.cy, g.innerRadius, bgGrad)

    ctx.lineWidth = 4
    drawCircle(ctx, g.cx, g.cy, g.innerRadius, 'rgba(0,0,0,0.8)', true)
}

const drawTicks = (ctx: CanvasRenderingContext2D, g: GaugeContext) => {
    const numMajor = g.numMajor || 6
    const numMinor = numMajor * 5

    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i <= numMinor; i++) {
        const angle = (g.minAngle + (i / numMinor) * g.totalAngle) - g.drawAngleOffset
        const start = polarToCartesian(g.cx, g.cy, g.innerRadius * 0.88, angle)
        const end = polarToCartesian(g.cx, g.cy, g.innerRadius * 0.96, angle)
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
    }
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2.5
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `bold ${g.radius * 0.14}px 'Inter', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i <= numMajor; i++) {
        const logicalAngle = g.minAngle + (i / numMajor) * g.totalAngle
        const angle = logicalAngle - g.drawAngleOffset
        const val = g.minVal + (i / numMajor) * (g.maxVal - g.minVal)

        const start = polarToCartesian(g.cx, g.cy, g.innerRadius * 0.75, angle)
        const end = polarToCartesian(g.cx, g.cy, g.innerRadius * 0.96, angle)

        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()

        const labelPos = polarToCartesian(g.cx, g.cy, g.innerRadius * 0.55, angle)
        ctx.fillText(Math.round(val).toString(), labelPos.x, labelPos.y)
    }

    const zeroAngle = (g.minAngle + ((0 - g.minVal) / (g.maxVal - g.minVal)) * g.totalAngle) - g.drawAngleOffset
    const zoneHalf = g.totalAngle * 0.08

    ctx.beginPath()
    ctx.arc(g.cx, g.cy, g.innerRadius * 0.92, zeroAngle - zoneHalf, zeroAngle + zoneHalf)
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)'
    ctx.lineWidth = g.innerRadius * 0.06
    ctx.stroke()
}

const drawNeedle = (ctx: CanvasRenderingContext2D, g: GaugeContext, value: number) => {
    const clamped = Math.max(g.minVal, Math.min(g.maxVal, value))
    const needleAngle = (g.minAngle + ((clamped - g.minVal) / (g.maxVal - g.minVal)) * g.totalAngle) - g.drawAngleOffset

    const needleLength = g.innerRadius * 0.8
    const needleBase = g.innerRadius * 0.12

    ctx.save()
    ctx.translate(g.cx, g.cy)
    ctx.rotate(needleAngle)

    ctx.shadowColor = g.accentColor
    ctx.shadowBlur = 10

    ctx.beginPath()
    ctx.moveTo(needleLength, 0)
    ctx.lineTo(0, needleBase / 2)
    ctx.lineTo(-needleBase * 0.5, 0)
    ctx.lineTo(0, -needleBase / 2)
    ctx.closePath()
    ctx.fillStyle = g.accentColor
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(needleLength * 0.8, 0)
    ctx.lineTo(0, 1.5)
    ctx.lineTo(0, -1.5)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fill()
    ctx.restore()

    drawCircle(ctx, g.cx, g.cy, g.radius * 0.07, '#222')
    drawCircle(ctx, g.cx, g.cy, g.radius * 0.03, g.accentColor)
}

const drawGlassGlare = (ctx: CanvasRenderingContext2D, g: GaugeContext) => {
    ctx.beginPath()
    ctx.arc(g.cx, g.cy, g.innerRadius, Math.PI + 0.2, Math.PI * 2 - 0.2)
    ctx.ellipse(g.cx, g.cy - g.radius * 0.2, g.innerRadius * 0.8, g.innerRadius * 0.4, 0, 0, Math.PI, true)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.fill()
}

const drawLabels = (ctx: CanvasRenderingContext2D, g: GaugeContext, value: number) => {
    const labelY = g.cy + g.radius + 25

    ctx.font = `bold ${g.radius * 0.16}px 'Inter', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(g.label.toUpperCase(), g.cx, labelY)

    ctx.font = `bold ${g.radius * 0.22}px monospace`
    ctx.fillStyle = g.accentColor
    const sign = value > 0 ? '+' : ''
    ctx.fillText(`${sign}${value.toFixed(1)}°`, g.cx, labelY + g.radius * 0.25)
}

export function drawGauge(
    ctx: CanvasRenderingContext2D,
    config: GaugeConfig,
    value: number
): void {
    ctx.save()

    const gaugeContext: GaugeContext = {
        ...config,
        innerRadius: config.radius * 0.88,
        totalAngle: config.maxAngle - config.minAngle,
        drawAngleOffset: Math.PI / 2
    }

    drawBezel(ctx, gaugeContext)
    drawBackground(ctx, gaugeContext)
    drawTicks(ctx, gaugeContext)
    drawNeedle(ctx, gaugeContext, value)
    drawGlassGlare(ctx, gaugeContext)
    drawLabels(ctx, gaugeContext, value)

    ctx.restore()
}