import { Network } from "../network";

export interface ITransactionsSubscriptionMessage {
    /**
     * The latest transactions.
     */
    transactions: {
        [key in Network]?: { [hash: string]: number }
    };

    /**
     * The tps counts.
     */
    tps: {
        [key in Network]?: number[];
    };

    /**
     * The interval for the tps data.
     */
    tpsInterval: number;
}
