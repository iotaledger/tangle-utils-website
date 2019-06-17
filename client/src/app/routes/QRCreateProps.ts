import { RouteComponentProps } from "react-router-dom";

export interface QRCreateProps extends RouteComponentProps<{
    /**
     * The address to create qr code.
     */
    address?: string;
    /**
     * The amount.
     */
    amount?: string;
    /**
     * The message.
     */
    message?: string;
}> {
    /**
     * Bust
     */
    bust: number;
}
