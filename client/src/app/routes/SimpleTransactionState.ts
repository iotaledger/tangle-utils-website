import { NetworkType } from "../../models/services/networkType";

export interface SimpleTransactionState {
    /**
     * Tag for the transaction.
     */
    tag: string;

    /**
     * Validation for tag.
     */
    tagValidation: string;

    /**
     * Message.
     */
    message: string;

    /**
     * Number of transaction required.
     */
    transactionCount: number;

    /**
     * Address.
     */
    address: string;

    /**
     * Address.
     */
    addressValidation: string;

    /**
     * Trytes version of the text.
     */
    network: NetworkType;

    /**
     * The transaction hash for the attached message.
     */
    transactionHash: string;

    /**
     * Has the attach errored.
     */
    errorMessage: string;

    /**
     * The status of the component.
     */
    status: string;

    /**
     * Is the component busy.
     */
    isBusy: boolean;

    /**
     * Is the component errored.
     */
    isErrored: boolean;

    /**
     * Is the component valid.
     */
    isValid: boolean;

    /**
     * Show the map.
     */
    showLocation: boolean;
}
