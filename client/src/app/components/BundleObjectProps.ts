import { Network } from "../../models/network";

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
    network: Network;
}
