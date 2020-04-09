import { Network } from "../../models/network";

export interface TransactionSummaryProps {
    /**
     * The hash for the object.
     */
    hash: string;

    /**
     * The network to use.
     */
    network: Network;
}
