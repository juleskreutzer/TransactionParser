import type { TypedEventEmitter } from "../events/typedEventEmitter.ts";
import type { IEvent } from "./event.interface.ts";

/**
 * @interface
 * 
 * Classes implementing this interface support emitting events via {@link TypedEventEmitter}
 */
export interface IEventSupport {
    /**
     * Get the TypedEventEmitter instance used
     * @returns TypedEventEmitter
     */
    getEventEmitter(): TypedEventEmitter<IEvent>
}