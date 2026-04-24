/**
 * useWebSocket.ts
 * ---------------
 * Composable that manages the WebSocket connection with the backend.
 *
 * Responsibilities:
 * - Automatically connect and reconnect if the connection is lost
 * - Parse incoming messages as typed WsMessages
 * - Expose the reactive connection state
 * - Provide sendCommand() to send commands to the server
 *
 * Does NOT handle the simulation state; that is the responsibility of useSimState.ts. This composable only handles the transport.
 */

import { ref, onUnmounted } from 'vue'
import {type WsMessage, type WsCommand, isSimState} from '@/types/simulation'

// WebSocket URL - in dev Vite it proxies /ws to localhost:8000
const WS_URL = `ws://${window.location.hostname}:8000/ws/sim`
const RECONNECT_DELAY = 2000

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function useWebSocket(onMessage: (msg: WsMessage) => void) {
    const status = ref<ConnectionStatus>('connecting')

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let destroyed = false

    function connect() {
        if (destroyed) return

        status.value = 'connecting'
        socket = new WebSocket(WS_URL)

        socket.onopen = () => {
            status.value = 'connected'
        }

        socket.onmessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data as string)

                if (isSimState(msg)) {
                    onMessage(msg) // msg is SimState here, fully narrowed, zero casts
                    return
                }

                // Logged but not thrown — unknown frames are non-fatal
                console.warn('[WS] Unrecognized message frame:', msg)
            } catch {
                console.warn('[WS] Failed to parse message frame:', event.data)
            }
        }

        socket.onclose = () => {
            status.value = 'disconnected'
            socket = null
            scheduleReconnect()
        }

        socket.onerror = () => {
            // onerror is always followed by onclose, so
            // reconnection is handled there
            status.value = 'disconnected'
        }
    }

    function scheduleReconnect() {
        if (destroyed) return
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY)
    }

    function sendCommand(cmd: WsCommand) {
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(cmd))
        }
    }

    onUnmounted(() => {
        destroyed = true
        if (reconnectTimer) clearTimeout(reconnectTimer)
        socket?.close()
    })

    // Start connection immediately
    connect()
    return { status, sendCommand }
}