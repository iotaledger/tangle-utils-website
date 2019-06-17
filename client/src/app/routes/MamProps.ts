import { MamMode } from "@iota/mam";
import { RouteComponentProps } from "react-router-dom";
import { NetworkType } from "../../models/services/networkType";

export interface MamProps extends RouteComponentProps<{
    /**
     * The root to start viewing.
     */
    root?: string;

    /**
     * The mode for decoding.
     */
    mode?: MamMode;

    /**
     * The key for decoding.
     */
    key?: string;

    /**
     * The network.
     */
    network?: NetworkType;
}> {
    /**
     * Bust
     */
    bust: number;
}
