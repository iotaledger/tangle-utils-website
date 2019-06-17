import { NetworkType } from "../../models/services/networkType";

export interface BundleObjectProps {
    /**
     * The hash of the bundle.
     */
    hash: string;

    /**
     * The hash for the transactions.
     */
    transactionHashes: ReadonlyArray<string>;

    /**
     * The network to use.
     */
    network: NetworkType;
}
