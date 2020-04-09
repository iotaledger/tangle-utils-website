import { Unit } from "@iota/unit-converter";
import { Network } from "../../models/network";

export interface TransactionsFeedState {
    /**
     * The transactions.
     */
    transactions: {
        [id: string]: {
            /**
             * The tx hash.
             */
            hash: string;
            /**
             * The tx value.
             */
            value: number
        }[]
     };

    /**
     * The tps.
     */
    tps: {
        [id: string]: string
    };

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
