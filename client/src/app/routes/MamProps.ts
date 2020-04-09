import { RouteComponentProps } from "react-router-dom";

export interface MamProps extends RouteComponentProps<{
    /**
     * The root to start viewing.
     */
    root?: string;

    /**
     * The mode for decoding.
     */
    prop1?: string;

    /**
     * The key for decoding or network.
     */
    prop2?: string;

    /**
     * The network if prop1 key was skipped.
     */
    prop3?: string;
}> {
    /**
     * Bust
     */
    bust: number;
}
