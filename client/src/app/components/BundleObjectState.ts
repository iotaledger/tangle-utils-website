import { Transaction } from "@iota/transaction-converter";
import { ConfirmationState } from "../../models/confirmationState";

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
        transactions: ReadonlyArray<Transaction>;
    }>;

    /**
     * Is the component busy.
     */
    isBusy: boolean;
}
