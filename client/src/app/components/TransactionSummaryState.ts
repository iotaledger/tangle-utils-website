import { Transaction } from "@iota/transaction-converter";
import moment from "moment";
import { ConfirmationState } from "../../models/confirmationState";

export interface TransactionSummaryState {
    /**
     * The transaction from the tangle.
     */
    transactionObject?: Transaction;

    /**
     * The time of the transaction.
     */
    time?: moment.Moment;

    /**
     * Human format of the time.
     */
    timeHuman?: string;

    /**
     * Is the transaction confirmed.
     */
    confirmationState?: ConfirmationState;

    /**
     * Formatted value.
     */
    valueIota?: string;
}
