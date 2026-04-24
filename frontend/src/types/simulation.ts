/**
 * simulation.ts
 * -------------
 * TypeScript interfaces that model the complete WebSocket protocol.
 * All communication between the frontend and backend must pass through these types.
 */

export type TurbulenceIntensity = 'low' | 'medium' | 'high'

export interface Position {
    x: number;
    y: number;
}

export interface Velocity {
    x: number;
    y: number;
}

export interface Control {
    ux: number;
    uy: number;
}

export interface Turbulence {
    x: number;
    y: number;
}

/** Complete aircraft status. Server "state" type message */
export interface SimState {
    type:                 'state'
    time:                 number
    position:             Position
    velocity:             Velocity
    control:              Control
    turbulence:           Turbulence
    turbulence_intensity: TurbulenceIntensity
}

/** Union of all possible messages from the server (scalable) */
export type WsMessage = SimState


export interface ResetCommand {
    type: 'reset'
}

export interface TurbulencePulseCommand {
    type:      'turbulence_pulse'
    intensity: TurbulenceIntensity
}

export interface PauseCommand {
    type:  'pause'
    value: boolean
}

/** Discriminated union of all commands that the client can send */
export type WsCommand =
    | ResetCommand
    | TurbulencePulseCommand
    | PauseCommand