
export interface CurrencyConversionState {
    /**
     * Is the form busy.
     */
    isBusy: boolean;

    /**
     * Has the request errored.
     */
    isErrored: boolean;

    /**
     * Status message to display.
     */
    status: string;

    /**
     * The base currency rate.
     */
    baseCurrencyRate?: number;

    /**
     * The loaded currencies.
     */
    currencies?: {
        /**
         * Id of the currency.
         */
        id: string;
        /**
         * The rate.
         */
        rate: number
    }[];

    /**
     * The fiat code.
     */
    fiatCode?: string;

    /**
     * The currency value input.
     */
    fiat: string;

    /**
     * The currency iota value input.
     */
    currencyIota: string;

    /**
     * The currency kiota value input.
     */
    currencyKiota: string;

    /**
     * The currency miota value input.
     */
    currencyMiota: string;

    /**
     * The currency giota value input.
     */
    currencyGiota: string;

    /**
     * The currency tiota value input.
     */
    currencyTiota: string;

    /**
     * The currency piota value input.
     */
    currencyPiota: string;
}
