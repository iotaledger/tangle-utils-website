import { asTransactionObject } from "@iota/transaction-converter";
import { Fieldrow, Fieldset, Form, Heading, TextArea } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { NetworkType } from "../../models/services/networkType";
import TransactionObject from "../components/TransactionObject";
import { TransactionDecoderProps } from "./TransactionDecoderProps";
import { TransactionDecoderState } from "./TransactionDecoderState";

/**
 * Component for converting transactions.
 */
class TransactionDecoder extends Component<TransactionDecoderProps, TransactionDecoderState> {
    /**
     * Create a new instance of TransactionDecoder.
     * @param props The props.
     */
    constructor(props: TransactionDecoderProps) {
        super(props);

        let paramTrytes = "";
        let paramNetwork: NetworkType = "mainnet";

        if (this.props.match && this.props.match.params) {
            if (this.props.match.params.trytes) {
                paramTrytes = this.props.match.params.trytes.toUpperCase();
            }
            if (this.props.match.params.network === "mainnet" ||
                this.props.match.params.network === "devnet") {
                paramNetwork = this.props.match.params.network;
            }
        }

        this.state = {
            trytes: paramTrytes,
            trytesValidation: "",
            hash: "",
            network: paramNetwork
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        if (this.state.trytes.length > 0) {
            await this.trytesUpdated();
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <React.Fragment>
                <Heading level={1}>Transaction Decoder</Heading>
                <Form>
                    <Fieldset>
                        <label>Transaction Trytes</label>
                        <TextArea
                            value={this.state.trytes}
                            onChange={(e) => this.setState({ trytes: e.target.value }, () => this.trytesUpdated())}
                            rows={10}
                            placeholder="Enter transaction payload trytes"
                            restrict="trytes"
                        />
                    </Fieldset>
                    {this.state.trytesValidation && (
                        <Fieldrow>
                            <div className="danger">{this.state.trytesValidation}</div>
                        </Fieldrow>
                    )}
                    {this.state.trytes && this.state.hash && (
                        <React.Fragment>
                            <hr />
                            <Heading level={1}>Transaction</Heading>
                            <TransactionObject hash={this.state.hash} trytes={this.state.trytes} network={this.state.network} hideInteractive={true} />
                        </React.Fragment>
                    )}
                </Form>
            </React.Fragment>
        );
    }

    /**
     * Validate the transaction hash and load if valid.
     */
    private async trytesUpdated(): Promise<void> {
        const isValid = this.validate();

        if (isValid) {
            try {
                const transaction = asTransactionObject(this.state.trytes.toUpperCase());

                this.setState({ trytesValidation: "", hash: transaction.hash });
            } catch (err) {
                this.setState({ trytesValidation: "Unable to decode trytes" });
            }
        }
    }

    /**
     * Decode the trytes into its fields.
     * @returns True if valid.
     */
    private validate(): boolean {
        let trytesValidation = "";

        const trytes = this.state.trytes.toUpperCase();

        if (trytes.length > 0) {
            if (trytes.length !== 2673) {
                trytesValidation = `The trytes must be 2673 in length, it is ${trytes.length}.`;
            }

            if (!/^[9A-Z]*$/.test(trytes)) {
                trytesValidation = "Trytes must be characters A-Z or 9.";
            }
        }

        this.setState({
            trytesValidation
        });

        return trytesValidation.length === 0;
    }
}

export default TransactionDecoder;
