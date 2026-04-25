export interface GaugeConfig {
    cx:          number
    cy:          number
    radius:      number
    minVal:      number
    maxVal:      number
    minAngle:    number
    maxAngle:    number
    label:       string
    accentColor: string
}


export function drawGauge(
    ctx: CanvasRenderingContext2D,
    config: GaugeConfig,
    value: number
): void {
    const { cx, cy, radius, minVal, maxVal, minAngle, maxAngle, label, accentColor } = config

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

    const innerRadius = radius * 0.85
    const bgGrad = ctx.createRadialGradient(cx, cy - radius * 0.2, 0, cx, cy, innerRadius)
    bgGrad.addColorStop(0, '#1e1e1e')
    bgGrad.addColorStop(1, '#0a0a0a')

    ctx.beginPath()
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = bgGrad
    ctx.fill()

    const totalAngle = maxAngle - minAngle
    const numMajor = 5
    const numMinor = 20

    for (let i = 0; i <= numMinor; i++) {
        const angle = minAngle + (i / numMinor) * totalAngle
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const r1 = innerRadius * 0.88
        const r2 = innerRadius * 0.95

        ctx.beginPath()
        ctx.moveTo(cx + cos * r1, cy + sin * r1)
        ctx.lineTo(cx + cos * r2, cy + sin * r2)
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 0.8
        ctx.stroke()
    }

    for (let i = 0; i <= numMajor; i++) {
        const angle = minAngle + (i / numMajor) * totalAngle
        const val   = minVal + (i / numMajor) * (maxVal - minVal)
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const r1 = innerRadius * 0.78
        const r2 = innerRadius * 0.95

        ctx.beginPath()
        ctx.moveTo(cx + cos * r1, cy + sin * r1)
        ctx.lineTo(cx + cos * r2, cy + sin * r2)
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        const labelR = innerRadius * 0.65
        ctx.font = `bold ${radius * 0.13}px monospace`
        ctx.fillStyle = 'rgba(255,255,255,0.55)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(
            Math.round(val).toString(),
            cx + cos * labelR,
            cy + sin * labelR
        )
    }

    const zeroAngle = minAngle + ((0 - minVal) / (maxVal - minVal)) * totalAngle
    const zoneHalf  = totalAngle * 0.08   // ±8% del rango total

    ctx.beginPath()
    ctx.arc(cx, cy, innerRadius * 0.91, zeroAngle - zoneHalf, zeroAngle + zoneHalf)
    ctx.strokeStyle = 'rgba(100, 220, 130, 0.35)'
    ctx.lineWidth = innerRadius * 0.08
    ctx.stroke()

    const clamped    = Math.max(minVal, Math.min(maxVal, value))
    const needleAngle = minAngle + ((clamped - minVal) / (maxVal - minVal)) * totalAngle

    const needleLength = innerRadius * 0.72
    const needleBase   = innerRadius * 0.18

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(needleAngle)

    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur  = 6

    ctx.beginPath()
    ctx.moveTo(0, -needleLength)
    ctx.lineTo( 3, -needleBase)
    ctx.lineTo(-3, -needleBase)
    ctx.closePath()
    ctx.fillStyle = accentColor
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(0, needleBase * 0.6)
    ctx.lineTo( 2.5, 0)
    ctx.lineTo(-2.5, 0)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.restore()

    const pivotGrad = ctx.createRadialGradient(cx - 1, cy - 1, 0, cx, cy, radius * 0.06)
    pivotGrad.addColorStop(0, '#ccc')
    pivotGrad.addColorStop(1, '#333')

    ctx.beginPath()
    ctx.arc(cx, cy, radius * 0.055, 0, Math.PI * 2)
    ctx.fillStyle = pivotGrad
    ctx.fill()

    const labelY = cy + radius + radius * 0.22

    ctx.font = `bold ${radius * 0.18}px monospace`
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, cx, labelY)

    ctx.font = `${radius * 0.16}px monospace`
    ctx.fillStyle = accentColor
    ctx.fillText(`${value >= 0 ? '+' : ''}${value.toFixed(1)}`, cx, labelY + radius * 0.22)

    ctx.restore()
}