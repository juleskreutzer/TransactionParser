import type { EventCallback } from "../type/eventCallback.type.ts";

/**
 * @class
 * 
 * The TypedEventEmitter class is used to provide a typed way of emitting events. 
 * 
 * It can be used by a consumer application to be notified during certain stages while executing this package, 
 * for example when parsing a copybook, an event is triggered at the start of parsing, at the start of every new line, at the end of every line
 * and at the end of processing.
 * 
 * ---
 * ### Supported events
 * - {@link IParsingEvent } defines the `start`, `newLine`, `endLine` and `end` event that are triggered during copybook parsing
 * 
 * 
 * @example
 * Subscribe to events
 * ```ts
 * const parser = new CopybookParser('/path/to/copybook');
 * const emitter = parser.getEventEmitter()
 * emitter.subscribe('start', (payload) => {
 *  console.log(payload) // contains properties copybook, rawData and preparedData
 * });
 * ```
 * 
 * Emitting events
 * ```ts
 * const emitter = new TypedEventEmitter<IParsingEvent>(); // start, newLine, endLine and end events will be available
 * emitter.emit('start', { copybook: '/path/to/copybook', rawData: '  rawData  ', preparedData: ['rawData']})
 * ```
 */
export class TypedEventEmitter<TEvents> {
    private listeners: {
        [K in keyof TEvents]?: EventCallback<TEvents[K]>[];
    } = {};

    /**
     * Subscribe to an event of type `K`
     * @template K Interface defining the events
     * @param event Type of event to subscribe to
     * @param callback Callback to execute when event is triggered
     */
    subscribe<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        this.listeners[event]!.push(callback);
    }

    /**
     * Unsubscribe to an event of type `K`
     * @template K  Interface defining the events
     * @param event  Type of event to unsubscribe for
     * @param callback Callback that will be unsubscribed
     */
    unsubscribe<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
        const callbacks = this.listeners[event]
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Emit event `event` of type `K` to all subscribers
     * @template K Interface defining the events
     * @param event Type of event to emit
     * @param payload Data that will be provided to the subscribers
     */
    emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
        const callbacks = this.listeners[event]
        if (callbacks) {
            // Create a copy to avoid issues when callbacks modify the listeners array
            const callbacksCopy = [...callbacks]
            callbacksCopy.forEach((cb) => cb(payload))
        }
    }

    /**
     * Subscribe to an event of type `K` only once.
     * 
     * After the event has been emitted, an unsubscribe for event of type `K` will be done
     * @template K Interface defining the events
     * @param event Type of event to subscribe to
     * @param callback Callback to execute when event is triggered
     */
    once<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
        const wrapper: EventCallback<TEvents[K]> = (payload) => {
            this.unsubscribe(event, wrapper)
            callback(payload)
        }
        this.subscribe(event, wrapper);
    }
}