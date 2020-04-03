
export interface InlineCurrencyState {
    /**
     * Formatted value in currency.
     */
    valueConverted?: string;

    /**
     * Formatted value in currency.
     */
    fiatCode?: string;

    /**
     * Formatted value in currency.
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
}
