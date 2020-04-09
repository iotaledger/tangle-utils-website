import { HashType } from "../../models/hashType";
import { Network } from "../../models/network";

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
    network: Network;

    /**
     * Is the component valid.
     */
    isValid: boolean;

    /**
     * Is the component valid.
     */
    validMessage: string;
}
