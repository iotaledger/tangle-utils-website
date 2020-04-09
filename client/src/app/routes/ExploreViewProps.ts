import { RouteComponentProps } from "react-router-dom";
import { HashType } from "../../models/hashType";
import { Network } from "../../models/network";

export interface ExploreViewProps extends RouteComponentProps<{
    /**
     * The hash to explore.
     */
    hash?: string;

    /**
     * The network.
     */
    network?: Network;
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
