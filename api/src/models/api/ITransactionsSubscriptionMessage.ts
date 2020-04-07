export interface ITransactionsSubscriptionMessage {
    /**
     * The latest transactions for mainnet.
     */
    mainnetTransactions: string[];

    /**
     * The mainnet tps counts.
     */
    mainnetTps: number[];

    /**
     * The latest transactions for devnet.
     */
    devnetTransactions: string[];

    /**
     * The devnet tps counts.
     */
    devnetTps: number[];

    /**
     * The interval for the tps data.
     */
    tpsInterval: number;

}
