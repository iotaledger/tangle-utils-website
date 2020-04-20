import { MamMode } from "@iota/mam.js";

export interface MamState {
    /**
     * The root to start viewing.
     */
    root: string;

    /**
     * The validation message for the root.
     */
    rootValidation: string;

    /**
     * The mode for decoding.
     */
    mode: MamMode;

    /**
     * The key for decoding.
     */
    key: string;

    /**
     * The validation message for the key.
     */
    keyValidation: string;

    /**
     * The network.
     */
    network: string;

    /**
     * Is the component valid.
     */
    isValid: boolean;

    /**
     * Is the component busy.
     */
    isBusy: boolean;

    /**
     * The packet retrieved from the channel.
     */
    packets: {
        /**
         * The root the packet was retrieved from.
         */
        root: string;

        /**
         * The next root the packet was retrieved from.
         */
        nextRoot: string;

        /**
         * The payload for the packet.
         */
        payload: string;

        /**
         * The decoded packet.
         */
        message: string;

        /**
         * The decoded type for the packet.
         */
        messageType: string;
    }[];
}
