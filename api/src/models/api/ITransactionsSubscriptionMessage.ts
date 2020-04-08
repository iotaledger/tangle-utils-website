export interface ITransactionsSubscriptionMessage {
    /**
     * The latest transactions for mainnet.
     */
    mainnetTransactions: { [hash: string]: number };

    /**
     * The mainnet tps counts.
     */
    mainnetTps: number[];

    /**
     * The latest transactions for devnet.
     */
    devnetTransactions: { [hash: string]: number };

    /**
     * The devnet tps counts.
     */
    devnetTps: number[];

    /**
     * The interval for the tps data.
     */
    tpsInterval: number;

}
