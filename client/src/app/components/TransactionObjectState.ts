import { Transaction } from "@iota/transaction-converter";
import moment from "moment";
import { ConfirmationState } from "../../models/confirmationState";

export interface TransactionObjectState {
    /**
     * The transaction from the tangle.
     */
    transactionObject: Transaction;

    /**
     * The transaction from the tangle.
     */
    time: moment.Moment;

    /**
     * Is the transaction confirmed.
     */
    confirmationState: ConfirmationState;

    /**
     * Is the transaction data missing.
     */
    isMissing: boolean;

    /**
     * Formatted value.
     */
    value: string;

    /**
     * The message decoded.
     */
    message: string;

    /**
     * Is the message plain text.
     */
    messageType: "" | "Trytes" | "ASCII" | "JSON";

    /**
     * Show the raw message.
     */
    messageShowRaw: boolean;

    /**
     * Does the message span all of the bundle transactions.
     */
    messageSpans: boolean;

    /**
     * The address checksum.
     */
    addressChecksum: string;

    /**
     * The attachment time for the transaction.
     */
    attachmentTime: moment.Moment;

    /**
     * The previous indexed transactions.
     */
    prevTransactionHash?: string;

    /**
     * The next indexed transactions.
     */
    nextTransactionHash?: string;

    /**
     * Is the bundle valid.
     */
    isBundleValid?: boolean;

    /**
     * The result of the bundle transactions.
     */
    bundleResult: string;
}
