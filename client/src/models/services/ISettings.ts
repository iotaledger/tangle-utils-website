import { Unit } from "@iota/unit-converter";
import { ValueFilter } from "./valueFilter";

export interface ISettings {
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
     * The fiat code for currency conversion.
     */
    fiatCode: string;

    /**
     * The time the last currency update happened.
     */
    lastCurrencyUpdate?: number;

    /**
     * The base currency for exchange rates.
     */
    baseCurrencyRate?: number;

    /**
     * The currencies used for conversion.
     */
    currencies?: {
        /**
         * Id of the currency.
         */
        id: string;
        /**
         * The rate.
         */
        rate: number;
    }[];
}
