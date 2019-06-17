import { RouteComponentProps } from "react-router-dom";
import { NetworkType } from "../../models/services/networkType";

export interface TransactionDecoderProps extends RouteComponentProps<{
    /**
     * The transaction trytes to decode.
     */
    trytes?: string;

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
