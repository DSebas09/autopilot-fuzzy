/**
 * useSimState.ts
 * --------------
 * Composable that maintains the reactive state of the simulation.
 * It is the bridge between the WebSocket (transport) and the components
 * Vue / canvas modules (state consumers).
 *
 * Exposes:
 * - simState: ref() with the latest SimState received from the server
 * - status: WebSocket connection status ('connecting' | 'connected' | 'disconnected')
 * - paused: local ref() that reflects whether the simulation is paused
 * - sendCommand(): sends a WebSocket Command to the server
 */

import { ref } from 'vue'
import { useWebSocket } from './useWebSocket'
import type { SimState, WsCommand, TurbulenceIntensity } from '@/types/simulation'

/** Initial state of the aircraft - everything at zero, low intensity */
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

    function handleMessage(msg: SimState) {
        simState.value = msg
    }

    const { status, sendCommand } = useWebSocket(handleMessage)

    function reset() {
        sendCommand({ type: 'reset' })
    }

    function triggerPulse(intensity: TurbulenceIntensity) {
        sendCommand({ type: 'turbulence_pulse', intensity })
    }

    function togglePause() {
        paused.value = !paused.value
        sendCommand({ type: 'pause', value: paused.value })
    }

    function send(cmd: WsCommand) {
        sendCommand(cmd)
    }

    return {
        simState,
        status,
        paused,
        reset,
        triggerPulse,
        togglePause,
        sendCommand: send,
    }
}