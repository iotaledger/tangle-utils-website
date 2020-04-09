import { Transaction } from "@iota/core";
import { Network } from "../../models/network";

export interface TransactionDecoderState {
    /**
     * The trytes for the transaction.
     */
    trytes: string;

    /**
     * The hash for the transaction.
     */
    hash: string;

    /**
     * Trytes status message.
     */
    trytesValidation: string;

    /**
     * The network.
     */
    network: Network;
}
