import { RouteComponentProps } from "react-router-dom";
import { HashType } from "../../models/hashType";
import { NetworkType } from "../../models/services/networkType";

export interface ExploreViewProps extends RouteComponentProps<{
    /**
     * The hash to explore.
     */
    hash?: string;

    /**
     * The network.
     */
    network?: NetworkType;
}> {
    /**
     * The type of the hash.
     */
    hashType?: HashType;

    /**
     * Bust
     */
    bust: number;
}
