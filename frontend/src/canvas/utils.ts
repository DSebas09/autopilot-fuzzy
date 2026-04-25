/** utils.ts */

/** Converts polar coordinates (radius, angle) to Cartesian coordinates (x, y). */
export function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
    return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
    }
}

/** Draw a basic circle (fill or border). */
export function drawCircle(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    style: string | CanvasGradient,
    isStroke = false
): void {
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

/** Draw the standard outer metal ring (bevel) for all instruments. */
export function drawBezel(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
    const bevelGrad = ctx.createRadialGradient(
        cx - radius * 0.3, cy - radius * 0.3, radius * 0.4,
        cx, cy, radius
    )
    bevelGrad.addColorStop(0, '#666666')
    bevelGrad.addColorStop(0.6, '#2a2a2a')
    bevelGrad.addColorStop(1, '#0a0a0a')

    drawCircle(ctx, cx, cy, radius, bevelGrad)

    ctx.lineWidth = 1
    drawCircle(ctx, cx, cy, radius, '#000', true)
}

/** Draw a curved glass reflection (glare) on the top of the instrument.*/
export function drawGlassGlare(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    innerRadius: number
): void {
    ctx.beginPath()
    ctx.arc(cx, cy, innerRadius, Math.PI + 0.2, Math.PI * 2 - 0.2)
    ctx.ellipse(cx, cy - radius * 0.2, innerRadius * 0.8, innerRadius * 0.4, 0, 0, Math.PI, true)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.fill()
}