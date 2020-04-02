import { FindTransactionsMode} from "./findTransactionsMode";
import { Network } from "./network";

export interface IFindTransactionsRequest {
    /**
     * The network to search on.
     */
    network: Network;

    /**
     * The hash to look for.
     */
    hash: string;

    /**
     * The mode to look for transactions.
     */
    mode: FindTransactionsMode;
}
