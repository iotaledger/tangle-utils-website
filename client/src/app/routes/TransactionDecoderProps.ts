import { RouteComponentProps } from "react-router-dom";
import { Network } from "../../models/network";

export interface TransactionDecoderProps extends RouteComponentProps<{
    /**
     * The transaction trytes to decode.
     */
    trytes?: string;

    /**
     * The network.
     */
    network?: Network;
}> {
    /**
     * Bust
     */
    bust: number;
}
