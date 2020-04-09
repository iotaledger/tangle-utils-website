import { Transaction } from "@iota/core";
import { ConfirmationState } from "../../models/confirmationState";
import { ICurrencySettings } from "../../models/services/ICurrencySettings";

export interface BundleObjectState {
    /**
     * The transactions groups for the bundle.
     */
    bundleGroups: ReadonlyArray<{
        /**
         * The confirmation state for the group.
         */
        confirmationState: ConfirmationState;
        /**
         * The transactions in the group.
         */
        transactions: ReadonlyArray<{
            /**
             * The transaction.
             */
            transaction: Transaction;
            /**
             * The value converted.
             */
            currencyConverted: string;
        }>;
    }>;

    /**
     * Is the component busy.
     */
    isBusy: boolean;

    /**
     * The currency data.
     */
    currencyData?: ICurrencySettings;
}
