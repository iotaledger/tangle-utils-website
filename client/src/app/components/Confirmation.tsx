import classNames from "classnames";
import React, { Component, ReactNode } from "react";
import "./Confirmation.scss";
import { ConfirmationProps } from "./ConfirmationProps";

/**
 * Component which will display a confirmation.
 */
class Confirmation extends Component<ConfirmationProps> {
    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return this.props.state === "unknown" ? null : (
            <div
                className={
                    classNames(
                        "value",
                        "confirmation",
                        { confirmed: this.props.state === "confirmed"},
                        { pending: this.props.state === "pending"},
                        { reattachment: this.props.state === "reattachment"}
                    )}
            >
                {this.props.state === "confirmed" && ("Confirmed")}
                {this.props.state === "pending" && ("Pending")}
                {this.props.state === "subtangle" && ("Subtangle not updated")}
                {this.props.state === "reattachment" && ("Reattachment Confirmed")}
            </div>
        );
    }
}

export default Confirmation;
