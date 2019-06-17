import { RouteComponentProps } from "react-router-dom";

export interface TextConversionProps extends RouteComponentProps<{
    /**
     * The plain text or trytes to convert.
     */
    plainTextOrTrytes: string;
}> {
    /**
     * Bust
     */
    bust: number;
}
