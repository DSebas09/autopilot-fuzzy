const PITCH_SCALE = 3.5
const PITCH_MARKS = [-20, -10, 0, 10, 20]

export function drawHorizon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    roll: number,
    pitch: number
): void {
    ctx.save()

    const bevelGrad = ctx.createRadialGradient(
        cx - radius * 0.2, cy - radius * 0.2, radius * 0.6,
        cx, cy, radius
    )
    bevelGrad.addColorStop(0, '#5a5a5a')
    bevelGrad.addColorStop(0.5, '#2a2a2a')
    bevelGrad.addColorStop(1, '#111')

    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = bevelGrad
    ctx.fill()

    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 2
    ctx.stroke()

    const innerRadius = radius * 0.88

    ctx.beginPath()
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2)
    ctx.clip()

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((roll * Math.PI) / 180)
    const pitchOffset = pitch * PITCH_SCALE
    ctx.translate(0, pitchOffset)

    const skyGrad = ctx.createLinearGradient(0, -innerRadius, 0, 0)
    skyGrad.addColorStop(0, '#1a3a6b')
    skyGrad.addColorStop(1, '#2a5fa8')

    ctx.fillStyle = skyGrad
    ctx.fillRect(-innerRadius * 2, -innerRadius * 2, innerRadius * 4, innerRadius * 2)

    const groundGrad = ctx.createLinearGradient(0, 0, 0, innerRadius)
    groundGrad.addColorStop(0, '#7a4a1e')
    groundGrad.addColorStop(1, '#4a2a0a')

    ctx.fillStyle = groundGrad
    ctx.fillRect(-innerRadius * 2, 0, innerRadius * 4, innerRadius * 2)

    ctx.beginPath()
    ctx.moveTo(-innerRadius * 1.5, 0)
    ctx.lineTo( innerRadius * 1.5, 0)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = 2
    ctx.stroke()

    for (const deg of PITCH_MARKS) {
        if (deg === 0) continue

        const markY      = -deg * PITCH_SCALE
        const markWidth  = deg % 20 === 0
            ? innerRadius * 0.55
            : innerRadius * 0.30

        ctx.beginPath()
        ctx.moveTo(-markWidth / 2, markY)
        ctx.lineTo( markWidth / 2, markY)
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'
        ctx.lineWidth = 1.2
        ctx.stroke()

        ctx.font = `bold ${radius * 0.10}px monospace`
        ctx.fillStyle = 'rgba(255,255,255,0.55)'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${deg > 0 ? '+' : ''}${deg}`, markWidth / 2 + 4, markY)
    }

    ctx.restore()

    ctx.save()
    ctx.translate(cx, cy)

    const rollArcR = innerRadius * 0.92
    ctx.beginPath()
    ctx.arc(0, 0, rollArcR, -Math.PI * 0.85, -Math.PI * 0.15)
    ctx.strokeStyle = 'rgba(255,255,255,0.30)'
    ctx.lineWidth = 1
    ctx.stroke()

    const rollMarkDegrees = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60]
    for (const deg of rollMarkDegrees) {
        const rad    = ((deg - 90) * Math.PI) / 180
        const isMajor = deg % 30 === 0
        const r1 = rollArcR
        const r2 = rollArcR - (isMajor ? innerRadius * 0.09 : innerRadius * 0.05)

        ctx.beginPath()
        ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1)
        ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2)
        ctx.strokeStyle = isMajor ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.35)'
        ctx.lineWidth   = isMajor ? 1.5 : 0.8
        ctx.stroke()
    }

    ctx.rotate((roll * Math.PI) / 180)
    ctx.beginPath()
    ctx.moveTo(0, -rollArcR + innerRadius * 0.10)
    ctx.lineTo(-5, -rollArcR + innerRadius * 0.02)
    ctx.lineTo( 5, -rollArcR + innerRadius * 0.02)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fill()

    ctx.restore()

    ctx.save()
    ctx.translate(cx, cy)

    const w = radius * 0.55
    const t = radius * 0.07

    ctx.fillStyle = '#f0c040'
    ctx.fillRect(-t / 2, -t * 1.5, t, t * 3)

    ctx.beginPath()
    ctx.moveTo(-t / 2,  t * 0.3)
    ctx.lineTo(-w / 2,  t * 0.6)
    ctx.lineTo(-w / 2, -t * 0.1)
    ctx.lineTo(-t / 2, -t * 0.5)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo( t / 2,  t * 0.3)
    ctx.lineTo( w / 2,  t * 0.6)
    ctx.lineTo( w / 2, -t * 0.1)
    ctx.lineTo( t / 2, -t * 0.5)
    ctx.closePath()
    ctx.fill()

    const tailW = w * 0.28
    ctx.beginPath()
    ctx.moveTo(-tailW / 2, -t * 1.2)
    ctx.lineTo( tailW / 2, -t * 1.2)
    ctx.lineTo( t    / 2,  -t * 0.3)
    ctx.lineTo(-t    / 2,  -t * 0.3)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.arc(0, 0, t * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    ctx.restore()

    ctx.font = `bold ${radius * 0.13}px monospace`
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ATT', cx, cy + innerRadius + radius * 0.14)

    ctx.restore()
}