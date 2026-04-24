/**
 * useSimState.ts
 * --------------
 * Composable that maintains the reactive state of the simulation.
 * It is the bridge between the WebSocket (transport) and the components
 * Vue / canvas modules (state consumers).
 *
 * Exposes:
 * - simState:      ref() with the latest SimState received from the server
 * - status:        WebSocket connection status
 * - paused:        local ref() — reflects pause state, guarded by sendCommand result
 * - sendCommand():  sends a typed WsCommand to the server
 * - reset():        resets the simulation to initial state
 * - triggerPulse(): triggers a turbulence pulse at the given intensity
 * - togglePause():  toggles the pause state
 */

import { ref } from 'vue'
import { useWebSocket } from './useWebSocket'
import type {SimState, TurbulenceIntensity, WsMessage} from '@/types/simulation'

/** Initial aircraft state, all axes zeroed, turbulence at low intensity */
const INITIAL_STATE: SimState = {
    type:                 'state',
    time:                 0,
    position:             { x: 0, y: 0 },
    velocity:             { x: 0, y: 0 },
    control:              { ux: 0, uy: 0 },
    turbulence:           { x: 0, y: 0 },
    turbulence_intensity: 'low',
}

export function useSimState() {
    const simState = ref<SimState>({ ...INITIAL_STATE })
    const paused = ref(false)

    function handleMessage(msg: WsMessage): void {
        simState.value = msg
    }

    const { status, sendCommand } = useWebSocket(handleMessage)

    function reset(): void {
        sendCommand({ type: 'reset' })
    }

    function triggerPulse(intensity: TurbulenceIntensity): void {
        sendCommand({ type: 'turbulence_pulse', intensity })
    }

    function togglePause(): void {
        const next = !paused.value
        const dispatched = sendCommand({ type: 'pause', value: next })
        if (dispatched) paused.value = next  // only update if command reached the server
    }

    return {
        simState,
        status,
        paused,
        reset,
        triggerPulse,
        togglePause,
        sendCommand,
    }
}