import { isHash, isTag, isTrytesOfExactLength } from "@iota/validators";
import { Button, Fieldrow, Fieldset, Form, FormActions, Heading, Input, Select } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { HashType } from "../../models/hashType";
import { NetworkType } from "../../models/services/networkType";
import TransactionsFeed from "../components/TransactionsFeed";
import "./Explore.scss";
import { ExploreProps } from "./ExploreProps";
import { ExploreState } from "./ExploreState";

/**
 * Component which will explore the tangle.
 */
class Explore extends Component<ExploreProps, ExploreState> {
    /**
     * Create a new instance of Explore.
     * @param props The props.
     */
    constructor(props: ExploreProps) {
        super(props);

        this.state = {
            hash: "",
            hashType: "transaction",
            network: "mainnet",
            isValid: false,
            validMessage: ""
        };
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="explore">
                <Heading level={1}>Tangle Explorer</Heading>
                <Form>
                    <Fieldset>
                        <label>Hash</label>
                        <Input
                            type="text"
                            value={this.state.hash}
                            placeholder="Enter trytes, select hash type and then click explore"
                            restrict="trytes"
                            onChange={e => this.setState({ hash: e.target.value }, () => this.validate())}
                        />
                    </Fieldset>
                    {this.state.validMessage && (
                        <Fieldrow>
                            <div className="danger">{this.state.validMessage}</div>
                        </Fieldrow>
                    )}
                    <Fieldset>
                        <label>Hash Type</label>
                        <Select
                            value={this.state.hashType}
                            onChange={e => this.setState(
                                { hashType: e.target.value as HashType },
                                () => this.validate())}
                            selectSize="small"
                        >
                            <option value="transaction">Transaction</option>
                            <option value="bundle">Bundle</option>
                            <option value="address">Address</option>
                            <option value="tag">Tag</option>
                        </Select>
                    </Fieldset>
                    <Fieldset>
                        <label>Network</label>
                        <Select
                            value={this.state.network}
                            onChange={e => this.setState(
                                { network: e.target.value as NetworkType }, () => this.validate())}
                            selectSize="small"
                        >
                            <option value="mainnet">MainNet</option>
                            <option value="devnet">DevNet</option>
                        </Select>
                    </Fieldset>
                    <FormActions>
                        <Button disabled={!this.state.isValid} onClick={() => this.navigate()}>Explore</Button>
                    </FormActions>
                </Form>
                <hr />
                <Heading level={2}>Feeds</Heading>
                <TransactionsFeed />
            </div>
        );
    }

    /**
     * Validate the form fields.
     * @returns True if the form is valid.
     */
    private validate(): boolean {
        let validMessage = "";
        if (!this.state.hash) {
            validMessage = "You must fill in the hash.";
        } else {
            if (this.state.hashType === "address") {
                if (!isHash(this.state.hash.toUpperCase())) {
                    validMessage = "The address hash must contain A-Z or 9 and be 81 or 90 trytes in length.";
                }
            } else if (this.state.hashType === "transaction" || this.state.hashType === "bundle") {
                if (!isTrytesOfExactLength(this.state.hash.toUpperCase(), 81)) {
                    validMessage = `The ${this.state.hashType} hash must contain A-Z or 9 and be 81 trytes in length.`;
                }
            } else {
                if (!isTag(this.state.hash.toUpperCase())) {
                    validMessage = `The tag hash must contain A-Z or 9 and be a maximum 27 trytes in length.`;
                }
            }
        }

        this.setState({ validMessage, isValid: validMessage.length === 0 });
        return validMessage.length === 0;
    }

    /**
     * Load the data from the tangle.
     */
    private async navigate(): Promise<void> {
        const network = this.state.network === "mainnet" ? "" : `/${this.state.network}`;

        this.props.history.push(`/${this.state.hashType}/${this.state.hash.toUpperCase()}${network}`);
    }
}

export default Explore;
