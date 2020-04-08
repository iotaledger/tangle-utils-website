import { Transaction } from "@iota/transaction-converter";
import moment from "moment";
import { ConfirmationState } from "../../models/confirmationState";

export interface TransactionObjectState {
    /**
     * The transaction from the tangle.
     */
    transactionObject: Transaction;

    /**
     * The time of the transaction.
     */
    time: moment.Moment;

    /**
     * Human format of the time.
     */
    timeHuman: string;

    /**
     * Is the transaction confirmed.
     */
    confirmationState: ConfirmationState;

    /**
     * Is the transaction data missing.
     */
    isMissing: boolean;

    /**
     * The mwm for the transaction.
     */
    mwm?: number;

    /**
     * Formatted value.
     */
    valueFormatted: string;

    /**
     * Formatted value.
     */
    valueIota: string;

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
     * Human format of the attachment time.
     */
    attachmentTimeHuman: string;

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

    /**
     * What is the tail hash for the bundle.
     */
    tailHash?: string;

    /**
     * Does the tag contain an area code.
     */
    iac?: string;

    /**
     * The milestone index if it is one.
     */
    milestoneIndex: number;
}
