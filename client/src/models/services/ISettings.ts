import { Unit } from "@iota/unit-converter";
import { ICurrencySettings } from "./ICurrencySettings";
import { IMapSettings } from "./IMapSettings";
import { ValueFilter } from "./valueFilter";

export interface ISettings extends ICurrencySettings, IMapSettings {
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

    /**
     * Map expanded.
     */
    isMapExpanded?: boolean;
}
