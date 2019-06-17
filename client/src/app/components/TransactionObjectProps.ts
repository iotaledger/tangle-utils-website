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
     * Hide the trytes for the object.
     */
    hideRaw?: boolean;

    /**
     * The network to use.
     */
    network: NetworkType;
}
