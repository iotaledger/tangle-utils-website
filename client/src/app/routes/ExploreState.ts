import { HashType } from "../../models/hashType";

export interface ExploreState {
    /**
     * Hash.
     */
    hash: string;

    /**
     * The type of the hash.
     */
    hashType: HashType;

    /**
     * The network.
     */
    network: string;

    /**
     * Is the component valid.
     */
    isValid: boolean;

    /**
     * Is the component valid.
     */
    validMessage: string;
}
