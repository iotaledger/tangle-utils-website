import { ICachedTransaction } from "../../models/ICachedTransaction";

export interface TransactionObjectProps {
    /**
     * The transaction object.
     */
    cached?: ICachedTransaction;

    /**
     * The trytes.
     */
    trytes?: string;

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
    network: string;
}
