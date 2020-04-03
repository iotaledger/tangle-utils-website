import { NetworkType } from "../../models/services/networkType";

export interface TransactionSummaryProps {
    /**
     * The hash for the object.
     */
    hash: string;

    /**
     * The network to use.
     */
    network: NetworkType;
}
