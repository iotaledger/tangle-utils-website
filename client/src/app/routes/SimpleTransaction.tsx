import { composeAPI, LoadBalancerSettings } from "@iota/client-load-balancer";
import { asTransactionObject, asTransactionTrytes } from "@iota/transaction-converter";
import { isTrytesOfExactLength, isTrytesOfMaxLength } from "@iota/validators";
import { init, pow } from "curl.lib.js";
import { Button, Fieldrow, Fieldset, Form, FormActions, FormStatus, Heading, Input, Select, Success, TextArea } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { TextHelper } from "../../helpers/textHelper";
import { NetworkType } from "../../models/services/networkType";
import "./SimpleTransaction.scss";
import { SimpleTransactionState } from "./SimpleTransactionState";

/**
 * Component which will attach a simple transaction to the tangle using local PoW.
 */
class SimpleTransaction extends Component<any, SimpleTransactionState> {
    /**
     * Create a new instance of SimpleTransaction.
     * @param props The props.
     */
    constructor(props: any) {
        super(props);

        this.state = {
            tag: "",
            tagValidation: "",
            message: "",
            address: "",
            addressValidation: "",
            network: "mainnet",
            errorMessage: "",
            transactionHash: "",
            status: "",
            isBusy: false,
            isErrored: false,
            isValid: false
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const network = this.props.network === "mainnet" ? "" : `/${this.props.network}`;

        return (
            <div className="simple-transaction">
                <Heading level={1}>Simple Transaction</Heading>
                <p>Attach a simple zero value message transaction to the tangle, using Proof Of Work in your browser.</p>
                <Form>
                    <Fieldset>
                        <label>Address</label>
                        <Input
                            type="text"
                            value={this.state.address}
                            onChange={(e) => this.setState({ address: e.target.value }, () => this.validate())}
                            restrict="trytes"
                            disabled={this.state.isBusy}
                            placeholder="Address to attach the message"
                        />
                    </Fieldset>
                    {this.state.addressValidation && (
                        <Fieldrow>
                            <div className="danger">{this.state.addressValidation}</div>
                        </Fieldrow>
                    )}
                    <Fieldset>
                        <label>Message</label>
                        <TextArea
                            value={this.state.message}
                            onChange={(e) => this.setState({ message: e.target.value })}
                            disabled={this.state.isBusy}
                            rows={10}
                            placeholder="Message in plain text"
                        />
                    </Fieldset>
                    <Fieldset>
                        <label>Tag</label>
                        <Input
                            type="text"
                            value={this.state.tag}
                            onChange={(e) => this.setState({ tag: e.target.value }, () => this.validate())}
                            restrict="trytes"
                            disabled={this.state.isBusy}
                            maxLength={27}
                            placeholder="Optional tag in trytes"
                        />
                    </Fieldset>
                    {this.state.tagValidation && (
                        <Fieldrow>
                            <div className="danger">{this.state.tagValidation}</div>
                        </Fieldrow>
                    )}
                    <Fieldset>
                        <label>Network</label>
                        <Select
                            value={this.state.network}
                            onChange={(e) => this.setState({ network: e.target.value as NetworkType })}
                            selectSize="small"
                            disabled={this.state.isBusy}
                        >
                            <option value="mainnet">MainNet</option>
                            <option value="devnet">DevNet</option>
                        </Select>
                    </Fieldset>
                    <FormActions>
                        <Button disabled={this.state.isBusy || !this.state.isValid} onClick={() => this.attachMessage()}>Attach Message</Button>
                    </FormActions>
                    <FormStatus message={this.state.status} isBusy={this.state.isBusy} isError={this.state.isErrored} />
                    {this.state.transactionHash && (
                        <React.Fragment>
                            <Fieldrow>
                                <div className="row-success">
                                    <Success />
                                    <div>The transaction was successfully created.</div>
                                </div>
                            </Fieldrow>
                            <Fieldrow>
                                <Link to={`/transaction/${this.state.transactionHash}${network}`}>{this.state.transactionHash}</Link>
                            </Fieldrow>
                        </React.Fragment>
                    )}
                </Form>
            </div>
        );
    }

    /**
     * Validate the data
     */
    private validate(): void {
        const addressValidation = isTrytesOfExactLength(this.state.address.toUpperCase(), 81) || isTrytesOfExactLength(this.state.address.toUpperCase(), 90) ?
            "" : `The address hash must contain A-Z or 9 and be 81 or 90 trytes in length, it is length ${this.state.address.length}`;

        const tagValidation = this.state.tag.length === 0 || isTrytesOfMaxLength(this.state.tag.toUpperCase(), 27) ?
            "" : `The tag hash must contain A-Z or 9 and be a maximum 27 trytes in length, it is length ${this.state.tag.length}`;

        this.setState({
            addressValidation,
            tagValidation,
            isValid: addressValidation.length === 0 && tagValidation.length === 0
        });
    }

    /**
     * Attach the message to the tangle.
     */
    private attachMessage(): void {
        this.setState(
            {
                isBusy: true,
                status: "Performing Local Proof of Work, please wait...",
                isErrored: false,
                transactionHash: ""
            },
            async () => {
                try {
                    const loadBalancerSettings = ServiceFactory.get<LoadBalancerSettings>(`load-balancer-${this.state.network}`);
                    loadBalancerSettings.attachToTangle = this.localPow as any;

                    const api = composeAPI(loadBalancerSettings);

                    const preparedTrytes = await api.prepareTransfers(
                        "9".repeat(81),
                        [
                            {
                                value: 0,
                                address: this.state.address.toUpperCase(),
                                tag: this.state.tag.toUpperCase(),
                                message: TextHelper.toTrytes(this.state.message)
                            }
                        ]
                    );

                    // Use 0 for depth and mwm, the load balancer will replace with sensible values
                    const txs = await api.sendTrytes(preparedTrytes, 0, 0);

                    this.setState(
                        {
                            isBusy: false,
                            status: "",
                            isErrored: false,
                            transactionHash: txs[0].hash
                        }
                    );

                } catch (err) {
                    this.setState(
                        {
                            isBusy: false,
                            status: err.toString(),
                            isErrored: true
                        }
                    );
                }
            });
    }

    /**
     * Perform a proof of work on the data.
     * @param trunkTransaction The trunkTransaction to use for the pow.
     * @param branchTransaction The branchTransaction to use for the pow.
     * @param minWeightMagnitude The minimum weight magnitude.
     * @param trytes The trytes to perform the pow on.
     * @returns The trytes produced by the proof of work.
     */
    private async localPow(trunkTransaction: string, branchTransaction: string, minWeightMagnitude: number, trytes: ReadonlyArray<string>): Promise<ReadonlyArray<string>> {
        const finalTrytes: string[] = [];

        init();

        let previousTransactionHash: string | undefined;

        for (let i = 0; i < trytes.length; i++) {
            // Start with last index transaction
            // Assign it the trunk / branch which the user has supplied
            // If there is a bundle, chain the bundle transactions via
            // trunkTransaction together
            const tx = { ...asTransactionObject(trytes[i]) };

            tx.attachmentTimestamp = Date.now();
            tx.attachmentTimestampLowerBound = 0;
            tx.attachmentTimestampUpperBound = (Math.pow(3, 27) - 1) / 2;

            // If this is the first transaction, to be processed
            // Make sure that it's the last in the bundle and then
            // assign it the supplied trunk and branch transactions

            if (!previousTransactionHash) {
                // Check if last transaction in the bundle
                if (tx.lastIndex !== tx.currentIndex) {
                    throw new Error("Wrong bundle order. The bundle should be ordered in descending order from currentIndex");
                }
                tx.trunkTransaction = trunkTransaction;
                tx.branchTransaction = branchTransaction;
            } else {
                tx.trunkTransaction = previousTransactionHash;
                tx.branchTransaction = trunkTransaction;
            }

            const newTrytes = asTransactionTrytes(tx);

            const nonce = await pow({ trytes: newTrytes, minWeight: minWeightMagnitude });
            const returnedTrytes = newTrytes.substr(0, newTrytes.length - nonce.length).concat(nonce);

            // Calculate the hash of the new transaction with nonce and use that as the previous hash for next entry
            const returnTransaction = asTransactionObject(returnedTrytes);
            previousTransactionHash = returnTransaction.hash;

            finalTrytes.push(returnedTrytes);

        }

        return finalTrytes.reverse();
    }
}

export default SimpleTransaction;
