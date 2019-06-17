import { RouteComponentProps } from "react-router-dom";

export interface ExploreProps extends RouteComponentProps<any> {
    /**
     * Bust
     */
    bust: number;
}
