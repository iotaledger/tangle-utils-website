export interface CompressState {
    /**
     * The trytes for the transaction.
     */
    trytes: string;

    /**
     * Trytes status message.
     */
    trytesValidation: string;

    /**
     * Compressed output.
     */
    compressed: string;

    /**
     * The original length.
     */
    originalLength: number;

    /**
     * The compressed length.
     */
    compressedLength: number;

    /**
     * The savings.
     */
    savings: number;
}
