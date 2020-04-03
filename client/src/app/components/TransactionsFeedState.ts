import { Transaction } from "@iota/transaction-converter";
import { Unit } from "@iota/unit-converter";

export interface TransactionsFeedState {
    /**
     * The transactions from mainNet.
     */
    mainnetTransactions: Transaction[];

    /**
     * The transactions from devNet.
     */
    devnetTransactions: Transaction[];

    /**
     * Limit the transactions by value.
     */
    valueMinimum: string;

    /**
     * The unit type.
     */
    valueMinimumUnits: Unit;

    /**
     * Limit the transactions by value.
     */
    valueMaximum: string;

    /**
     * The unit type.
     */
    valueMaximumUnits: Unit;

    /**
     * Filter specific value types.
     */
    valueFilter: "zeroOnly" | "nonZeroOnly" | "both";
}
