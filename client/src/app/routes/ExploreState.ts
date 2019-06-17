import { HashType } from "../../models/hashType";
import { NetworkType } from "../../models/services/networkType";

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
    network: NetworkType;

    /**
     * Is the component valid.
     */
    isValid: boolean;

    /**
     * Is the component valid.
     */
    validMessage: string;
}
