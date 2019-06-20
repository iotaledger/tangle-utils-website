import { NetworkType } from "../../models/services/networkType";

export interface TransactionObjectProps {
    /**
     * The trytes for the object.
     */
    trytes: string;

    /**
     * The hash for the object.
     */
    hash: string;

    /**
     * Hide the interactive parts for the object.
     */
    hideInteractive?: boolean;

    /**
     * The network to use.
     */
    network: NetworkType;
}
