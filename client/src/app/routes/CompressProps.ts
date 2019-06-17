import { RouteComponentProps } from "react-router-dom";

export interface CompressProps extends RouteComponentProps<{
    /**
     * The trytes to compress.
     */
    trytes?: string;
}> {
    /**
     * Bust
     */
    bust: number;
}
