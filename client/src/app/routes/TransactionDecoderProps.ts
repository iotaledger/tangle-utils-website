import { RouteComponentProps } from "react-router-dom";

export interface TransactionDecoderProps extends RouteComponentProps<{
    /**
     * The transaction trytes to decode.
     */
    trytes?: string;

    /**
     * The network.
     */
    network?: string;
}> {
    /**
     * Bust
     */
    bust: number;
}
