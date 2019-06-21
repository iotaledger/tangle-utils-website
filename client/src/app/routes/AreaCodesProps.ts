import { RouteComponentProps } from "react-router-dom";

export interface AreaCodesProps extends RouteComponentProps<{
    /**
     * The iac to display.
     */
    iac?: string;
}> {
    /**
     * Bust
     */
    bust: number;
}
