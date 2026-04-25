const PITCH_DISPLACEMENT = 0.25
const ROLL_ROTATION_MAX = 40


export function drawYoke(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    ux: number,
    uy: number
): void {
    ctx.save()

    const yokeW = size * 1.0
    const yokeH = size * 0.55
    const stemH = size * 0.55
    const wheelR = yokeH * 0.42
    const armW = yokeW * 0.42
    const gripH = yokeH * 0.60
    const gripW = size  * 0.13

    const pitchOffset = -(uy / 20) * size * PITCH_DISPLACEMENT
    const rollAngle = ((ux / 20) * ROLL_ROTATION_MAX * Math.PI) / 180
    const panelR = size * 0.92
    const bgGrad = ctx.createRadialGradient(cx, cy - size * 0.1, 0, cx, cy, panelR)

    bgGrad.addColorStop(0, '#1a1a1e')
    bgGrad.addColorStop(1, '#0d0d10')

    ctx.beginPath()
    ctx.arc(cx, cy, panelR, 0, Math.PI * 2)
    ctx.fillStyle = bgGrad
    ctx.fill()

    const bevelGrad = ctx.createRadialGradient(
        cx - panelR * 0.2, cy - panelR * 0.2, panelR * 0.7,
        cx, cy, panelR * 1.08
    )
    bevelGrad.addColorStop(0, '#4a4a4a')
    bevelGrad.addColorStop(0.5, '#222')
    bevelGrad.addColorStop(1, '#0a0a0a')

    ctx.beginPath()
    ctx.arc(cx, cy, panelR * 1.08, 0, Math.PI * 2)
    ctx.strokeStyle = bevelGrad
    ctx.lineWidth = panelR * 0.14
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, panelR * 1.08, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    const stemTopY  = cy - size * 0.05 + pitchOffset
    const stemBotY  = cy + stemH * 0.9

    const stemGrad = ctx.createLinearGradient(cx - size * 0.06, 0, cx + size * 0.06, 0)
    stemGrad.addColorStop(0,   '#1a1a1a')
    stemGrad.addColorStop(0.3, '#4a4a4a')
    stemGrad.addColorStop(0.7, '#3a3a3a')
    stemGrad.addColorStop(1,   '#111')

    ctx.beginPath()
    ctx.roundRect(cx - size * 0.055, stemTopY, size * 0.11, stemBotY - stemTopY, size * 0.04)
    ctx.fillStyle = stemGrad
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(cx, stemTopY + size * 0.06)
    ctx.lineTo(cx, stemBotY - size * 0.04)
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.save()
    ctx.translate(cx, cy - yokeH * 0.1 + pitchOffset)
    ctx.rotate(rollAngle)

    const armColor = '#2e2e35'

    ctx.beginPath()
    ctx.roundRect(-armW - gripW / 2, -yokeH * 0.15, armW, size * 0.11, size * 0.04)
    ctx.fillStyle = armColor
    ctx.fill()

    ctx.beginPath()
    ctx.roundRect(gripW / 2, -yokeH * 0.15, armW, size * 0.11, size * 0.04)
    ctx.fillStyle = armColor
    ctx.fill()

    const makeGripGrad = (gx: number) => {
        const g = ctx.createLinearGradient(gx - gripW, 0, gx + gripW, 0)
        g.addColorStop(0,   '#222')
        g.addColorStop(0.4, '#3d3d44')
        g.addColorStop(1,   '#1a1a1e')
        return g
    }

    ctx.beginPath()
    ctx.roundRect(-armW - gripW * 1.1, -gripH / 2, gripW * 1.4, gripH, size * 0.06)
    ctx.fillStyle = makeGripGrad(-armW)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.roundRect(armW - gripW * 0.3, -gripH / 2, gripW * 1.4, gripH, size * 0.06)
    ctx.fillStyle = makeGripGrad(armW)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    for (let i = -3; i <= 3; i++) {
        const gy = (i / 3) * gripH * 0.35
        ctx.beginPath()
        ctx.moveTo(-armW - gripW * 1.0, gy)
        ctx.lineTo(-armW + gripW * 0.2, gy)
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'
        ctx.lineWidth = 0.8
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

    ctx.beginPath()
    ctx.arc(0, 0, wheelR, 0, Math.PI * 2)
    ctx.fillStyle = hubGrad
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(0, 0, wheelR * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(79, 152, 163, 0.25)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(79, 152, 163, 0.60)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(0, 0, wheelR * 0.12, 0, Math.PI * 2)
    ctx.fillStyle = '#7fccd6'
    ctx.fill()

    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = size * 0.025

    ctx.beginPath()
    ctx.moveTo(-wheelR * 0.85, 0)
    ctx.lineTo(-armW * 0.35, 0)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(wheelR * 0.85, 0)
    ctx.lineTo(armW * 0.35, 0)
    ctx.stroke()

    ctx.restore()

    const magnitude = Math.sqrt(ux * ux + uy * uy) / 28.28
    if (magnitude > 0.05) {
        ctx.beginPath()
        ctx.arc(cx, cy, panelR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(79, 152, 163, ${magnitude * 0.4})`
        ctx.lineWidth = size * 0.06
        ctx.stroke()
    }

    const fontSize = size * 0.13
    ctx.font = `${fontSize}px monospace`
    ctx.textBaseline = 'bottom'

    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(79, 152, 163, 0.80)'
    ctx.fillText(`UX ${ux >= 0 ? '+' : ''}${ux.toFixed(1)}`, cx - panelR * 0.75, cy + panelR * 0.82)

    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(163, 120, 79, 0.80)'
    ctx.fillText(`UY ${uy >= 0 ? '+' : ''}${uy.toFixed(1)}`, cx + panelR * 0.75, cy + panelR * 0.82)

    ctx.font = `bold ${size * 0.13}px monospace`
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText('YOKE', cx, cy - panelR * 0.82)

    ctx.restore()
}