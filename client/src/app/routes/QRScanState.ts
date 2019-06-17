export interface QRScanState {
    /**
     * Has the request errored.
     */
    isErrored: boolean;

    /**
     * Status message to display.
     */
    status: string;

    /**
     * Show the QR Scanner.
     */
    showScanner: boolean;

    /**
     * Address for transaction.
     */
    address: string;

    /**
     * Amount for transaction.
     */
    amount: string;

    /**
     * Message for transaction.
     */
    message: string;

    /**
     * The text data.
     */
    dataText?: string;
}
