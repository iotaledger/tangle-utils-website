export interface TransactionDecoderState {
    /**
     * The trytes for the transaction.
     */
    trytes: string;

    /**
     * The hash for the transaction.
     */
    hash: string;

    /**
     * Trytes status message.
     */
    trytesValidation: string;

    /**
     * The network.
     */
    network: string;
}
