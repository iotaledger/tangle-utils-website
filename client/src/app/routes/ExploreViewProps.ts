import { RouteComponentProps } from "react-router-dom";
import { HashType } from "../../models/hashType";

export interface ExploreViewProps extends RouteComponentProps<{
    /**
     * The hash to explore.
     */
    hash?: string;

    /**
     * The network.
     */
    network?: string;
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
