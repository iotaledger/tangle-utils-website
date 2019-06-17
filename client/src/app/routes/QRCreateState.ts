export interface QRCreateState {
    /**
     * Is the data valid.
     */
    isValid: boolean;

    /**
     * Is the form busy.
     */
    isBusy: boolean;

    /**
     * Has the request errored.
     */
    isErrored: boolean;

    /**
     * Status message to display.
     */
    status: string;

    /**
     * Address for transaction.
     */
    address: string;

    /**
     * Address for transaction.
     */
    addressIsValid: boolean;

    /**
     * Amount for transaction.
     */
    amount: string;

    /**
     * Message for transaction.
     */
    message: string;

    /**
     * Tag for transaction.
     */
    tag: string;

    /**
     * The text data.
     */
    dataText?: string;

    /**
     * HTML Element for QR code.
     */
    qrHtml?: string;

    /**
     * Buffer for QR code.
     */
    qrDataPng?: Buffer;
}
