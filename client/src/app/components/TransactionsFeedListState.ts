export interface TransactionsFeedListState {
    /**
     * The transactions.
     */
    transactions: {
        /**
         * The tx hash.
         */
        hash: string;
        /**
         * The tx value.
         */
        value: number
    }[];

    /**
     * The tps.
     */
    tps: string;
}
