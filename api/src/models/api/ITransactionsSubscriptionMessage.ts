export interface ITransactionsSubscriptionMessage {
    /**
     * The latest transactions for mainnet.
     */
    mainnetTransactions: string[];

    /**
     * The latest transactions for devnet.
     */
    devnetTransactions: string[];
}
