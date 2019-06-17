
export interface TextConversionState {
    /**
     * Plain version of the text.
     */
    plain: string;

    /**
     * Trytes version of the text.
     */
    trytes: string;

    /**
     * Has the conversion errored.
     */
    errorMessage: string;
}
