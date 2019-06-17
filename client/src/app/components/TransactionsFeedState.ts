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
    valueLimit: number;

    /**
     * The unit type.
     */
    valueLimitUnits: Unit;

    /**
     * Filter specific value types.
     */
    valueFilter: "zeroOnly" | "nonZeroOnly" | "both";
}
