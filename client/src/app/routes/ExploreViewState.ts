import { HashType } from "../../models/hashType";
import { NetworkType } from "../../models/services/networkType";

export interface ExploreViewState {
    /**
     * Hash.
     */
    hash: string;

    /**
     * Checksum.
     */
    checksum: string;

    /**
     * The type of the hash.
     */
    hashType: HashType;

    /**
     * Is the component valid.
     */
    isValid: boolean;

    /**
     * Is the component valid.
     */
    validMessage: string;

    /**
     * Is the component busy.
     */
    isBusy: boolean;

    /**
     * Status message.
     */
    status: string;

    /**
     * Is the component errored.
     */
    isErrored: boolean;

    /**
     * The transaction from the tangle.
     */
    transactionTrytes?: string;

    /**
     * The transaction hashes from the tangle.
     */
    transactionHashes?: ReadonlyArray<string>;

    /**
     * The transaction count from the tangle.
     */
    transactionsCount?: string;

    /**
     * The network.
     */
    network: NetworkType;

    /**
     * The balance for an address.
     */
    balance: number;
}
