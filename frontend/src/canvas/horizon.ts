import {drawBezel, drawCircle, drawGlassGlare} from "@/canvas/utils.ts";

const PITCH_SCALE = 3.5
const PITCH_MARKS = [-20, -10, 0, 10, 20]
const ROLL_MARK_DEGREES = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]

interface HorizonContext {
    cx: number
    cy: number
    radius: number
    innerRadius: number
    rollRad: number
    pitchOffset: number
}



const drawSkyAndGround = (ctx: CanvasRenderingContext2D, h: HorizonContext) => {
    const skyGrad = ctx.createLinearGradient(0, -h.innerRadius, 0, 0)
    skyGrad.addColorStop(0, '#1a3a6b')
    skyGrad.addColorStop(1, '#2a5fa8')
    ctx.fillStyle = skyGrad
    ctx.fillRect(-h.innerRadius * 2, -h.innerRadius * 2, h.innerRadius * 4, h.innerRadius * 2)

    const groundGrad = ctx.createLinearGradient(0, 0, 0, h.innerRadius)
    groundGrad.addColorStop(0, '#7a4a1e')
    groundGrad.addColorStop(1, '#4a2a0a')
    ctx.fillStyle = groundGrad
    ctx.fillRect(-h.innerRadius * 2, 0, h.innerRadius * 4, h.innerRadius * 2)

    ctx.beginPath()
    ctx.moveTo(-h.innerRadius * 1.5, 0)
    ctx.lineTo( h.innerRadius * 1.5, 0)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 2
    ctx.stroke()
}

const drawPitchMarks = (ctx: CanvasRenderingContext2D, h: HorizonContext) => {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = `bold ${h.radius * 0.10}px 'Inter', sans-serif`

    for (const deg of PITCH_MARKS) {
        if (deg === 0) continue

        const markY = -deg * PITCH_SCALE // invertido: pitch+ -> avión sube -> línea baja
        const markWidth = deg % 20 === 0 ? h.innerRadius * 0.55 : h.innerRadius * 0.30

        ctx.beginPath()
        ctx.moveTo(-markWidth / 2, markY)
        ctx.lineTo( markWidth / 2, markY)
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.fillText(`${deg > 0 ? '+' : ''}${deg}`, markWidth / 2 + 6, markY)
    }
}

const drawRollIndicator = (ctx: CanvasRenderingContext2D, h: HorizonContext) => {
    ctx.save()
    ctx.translate(h.cx, h.cy)

    const rollArcR = h.innerRadius * 0.92

    ctx.beginPath()
    ctx.arc(0, 0, rollArcR, -Math.PI * 0.85, -Math.PI * 0.15)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    for (const deg of ROLL_MARK_DEGREES) {
        const rad = ((deg - 90) * Math.PI) / 180
        const isMajor = deg % 30 === 0
        const r1 = rollArcR
        const r2 = rollArcR - (isMajor ? h.innerRadius * 0.09 : h.innerRadius * 0.05)

        ctx.beginPath()
        ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1)
        ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2)
        ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'
        ctx.lineWidth = isMajor ? 2 : 1
        ctx.stroke()
    }

    ctx.rotate(h.rollRad)
    ctx.beginPath()
    ctx.moveTo(0, -rollArcR + h.innerRadius * 0.10)
    ctx.lineTo(-6, -rollArcR + h.innerRadius * 0.02)
    ctx.lineTo( 6, -rollArcR + h.innerRadius * 0.02)
    ctx.closePath()
    ctx.fillStyle = '#f39c12'
    ctx.fill()

    ctx.restore()
}

const drawAirplaneIcon = (ctx: CanvasRenderingContext2D, h: HorizonContext) => {
    ctx.save()
    ctx.translate(h.cx, h.cy)

    const w = h.radius * 0.6
    const t = h.radius * 0.08
    ctx.fillStyle = '#f39c12'

    ctx.fillRect(-t / 2, -t * 1.5, t, t * 3)

    ctx.beginPath()
    ctx.moveTo(-t / 2, t * 0.3)
    ctx.lineTo(-w / 2, t * 0.6)
    ctx.lineTo(-w / 2, -t * 0.1)
    ctx.lineTo(-t / 2, -t * 0.5)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo( t / 2, t * 0.3)
    ctx.lineTo( w / 2, t * 0.6)
    ctx.lineTo( w / 2, -t * 0.1)
    ctx.lineTo( t / 2, -t * 0.5)
    ctx.fill()

    const tailW = w * 0.3
    ctx.beginPath()
    ctx.moveTo(-tailW / 2, -t * 1.2)
    ctx.lineTo( tailW / 2, -t * 1.2)
    ctx.lineTo( t / 2, -t * 0.3)
    ctx.lineTo(-t / 2, -t * 0.3)
    ctx.fill()

    drawCircle(ctx, 0, 0, t * 0.4, '#fff')

    ctx.restore()
}

export function drawHorizon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, roll: number, pitch: number): void {
    ctx.save()

    const hContext: HorizonContext = {
        cx,
        cy,
        radius,
        innerRadius: radius * 0.88,
        rollRad: (roll * Math.PI) / 180,
        pitchOffset: pitch * PITCH_SCALE
    }

    drawBezel(ctx, hContext.cx, hContext.cy, hContext.radius)

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, hContext.innerRadius, 0, Math.PI * 2)
    ctx.clip()

    ctx.lineWidth = 4
    drawCircle(ctx, cx, cy, hContext.innerRadius, 'rgba(0,0,0,0.8)', true)

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(hContext.rollRad)
    ctx.translate(0, hContext.pitchOffset)

    drawSkyAndGround(ctx, hContext)
    drawPitchMarks(ctx, hContext)
    ctx.restore()
    ctx.restore()

    drawGlassGlare(ctx, hContext.cx, hContext.cy, hContext.radius, hContext.innerRadius)

    drawRollIndicator(ctx, hContext)
    drawAirplaneIcon(ctx, hContext)

    ctx.font = `bold ${radius * 0.14}px 'Inter', sans-serif`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ATTITUDE', cx, cy + hContext.innerRadius + radius * 0.18)

    ctx.restore()
}