/**
 * simulation.ts
 * -------------
 * TypeScript interfaces that model the complete WebSocket protocol.
 * All communication between the frontend and backend must pass through these types.
 */

export type TurbulenceIntensity = 'low' | 'medium' | 'high';

/** 2D coordinate used for both position and turbulence offset. */
export interface Position {
    readonly x: number;
    readonly y: number;
}

/** Rate of change of position per axis. */
export interface Velocity {
    readonly x: number;
    readonly y: number;
}

/** Fuzzy controller output — actuator deflection per axis. */
export interface Control {
    readonly ux: number;
    readonly uy: number;
}

/** Turbulence disturbance vector applied each simulation tick. */
export interface Turbulence {
    readonly x: number;
    readonly y: number;
}

/**
 * Complete aircraft status snapshot.
 * Emitted by the server on every simulation tick (~100ms).
 * Fields are readonly: this object must never be mutated on the client.
 */
export interface SimState {
    readonly type: 'state';
    readonly time: number;
    readonly position: Position;
    readonly velocity: Velocity;
    readonly control: Control;
    readonly turbulence: Turbulence;
    readonly turbulence_intensity: TurbulenceIntensity;
}

/**
 * Union of all possible messages from the server.
 * Currently only 'state' is emitted — this is intentional per the backend protocol.
 */
export type WsMessage = SimState;

export interface ResetCommand {
    type: 'reset';
}

export interface TurbulencePulseCommand {
    type: 'turbulence_pulse';
    intensity: TurbulenceIntensity;
}

export interface PauseCommand {
    type: 'pause';
    value: boolean;
}

/** Discriminated union of all commands the client can send to the server. */
export type WsCommand =
    | ResetCommand
    | TurbulencePulseCommand
    | PauseCommand;