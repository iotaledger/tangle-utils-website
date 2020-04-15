import { Unit } from "@iota/unit-converter";
import { Network } from "../../models/network";

export interface TransactionsFeedListProps {
    /**
     * The network to display.
     */
    network: Network;

    /**
     * The network name to display.
     */
    label: string;

    /**
     * The navigation path to append.
     */
    navPath: string;

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