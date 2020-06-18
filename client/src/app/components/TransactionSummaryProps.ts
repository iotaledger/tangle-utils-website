export interface TransactionSummaryProps {
    /**
     * The hash for the object.
     */
    hash: string;

    /**
     * The network to use.
     */
    network: string;

    /**
     * Show if non zero.
     */
    showNonZeroOnly: boolean;
}
