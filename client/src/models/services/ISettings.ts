import { Unit } from "@iota/unit-converter";
import { ICurrencySettings } from "./ICurrencySettings";
import { ValueFilter } from "./valueFilter";

export interface ISettings extends ICurrencySettings {
    /**
     * Value filter for feeds.
     */
    valueFilter?: ValueFilter;

    /**
     * Value limit feeds.
     */
    valueLimit?: number;

    /**
     * Value limit units for feeds.
     */
    valueLimitUnits?: Unit;
}
