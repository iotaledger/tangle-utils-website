import { composeAPI } from "@iota/core";
import { asTransactionTrytes } from "@iota/transaction-converter";
import { isTrytesOfExactLength, isTrytesOfMaxLength } from "@iota/validators";
import { Button, Fieldrow, Fieldset, Form, FormActions, FormStatus, Heading, Input, Select, Success, TextArea } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { PowHelper } from "../../helpers/powHelper";
import { TextHelper } from "../../helpers/textHelper";
import { IConfiguration } from "../../models/config/IConfiguration";
import { NetworkType } from "../../models/services/networkType";
import { ConfigurationService } from "../../services/configurationService";
import { SettingsService } from "../../services/settingsService";
import { TangleCacheService } from "../../services/tangleCacheService";
import AreaCodeMap from "../components/AreaCodeMap";
import "./SimpleTransaction.scss";
import { SimpleTransactionState } from "./SimpleTransactionState";

/**
 * Component which will attach a simple transaction to the tangle using local PoW.
 */
class SimpleTransaction extends Component<any, SimpleTransactionState> {
    /**
     * The tangle cache service.
     */
    private readonly _tangleCacheService: TangleCacheService;

    /**
     * The service to store settings.
     */
    private readonly _settingsService: SettingsService;

    /**
     * Create a new instance of SimpleTransaction.
     * @param props The props.
     */
    constructor(props: any) {
        super(props);

        this._tangleCacheService = ServiceFactory.get<TangleCacheService>("tangle-cache");
        this._settingsService = ServiceFactory.get<SettingsService>("settings");

        this.state = {
            tag: "",
            tagValidation: "",
            message: "",
            transactionCount: 1,
            address: "",
            addressValidation: "",
            network: "mainnet",
            errorMessage: "",
            transactionHash: "",
            status: "",
            isBusy: false,
            isErrored: false,
            isValid: false,
            showLocation: false,
            isPowAvailable: false
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        const settings = await this._settingsService.get();

        if (settings.isMapExpanded) {
            this.setState({ showLocation: settings.isMapExpanded });
        }

        const isPowAvailable = PowHelper.isAvailable();
        this.setState({ isPowAvailable });
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const network = this.state.network === "mainnet" ? "" : `/${this.state.network}`;

        return (
            <div className="simple-transaction">
                <Heading level={1}>Simple Transaction Sender</Heading>
                {!this.state.isPowAvailable && (
                    <p>Sorry, WebGL is not available in your browser,
                        you can not send a simple transaction using local PoW.</p>
                )}
                {this.state.isPowAvailable && (
                    <React.Fragment>
                        <p>Attach a simple zero value message transaction to the tangle,
                            using Proof Of Work in your browser.</p>
                        <Form>
                            <Fieldset>
                                <label>Address</label>
                                <Input
                                    type="text"
                                    value={this.state.address}
                                    onChange={e => this.setState({ address: e.target.value }, () => this.validate())}
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
                                    onChange={e => this.setState({ message: e.target.value }, () => {
                                        const trytes = TextHelper.toTrytes(this.state.message);
                                        this.setState({ transactionCount: Math.ceil(trytes.length / 2187) });
                                    })}
                                    disabled={this.state.isBusy}
                                    rows={10}
                                    placeholder="Message in plain text"
                                />
                            </Fieldset>
                            <Fieldrow>
                                <div>This message will occupy {this.state.transactionCount} transaction{
                                    this.state.transactionCount > 1 ? "s" : ""} on the tangle.</div>
                            </Fieldrow>
                            <Fieldset>
                                <label>Tag</label>
                                <Input
                                    type="text"
                                    value={this.state.tag}
                                    onChange={e => this.setState({ tag: e.target.value }, () => this.validate())}
                                    restrict="trytes"
                                    disabled={this.state.isBusy}
                                    maxLength={27}
                                    placeholder="Optional tag in trytes, click Show Location to use Area Code"
                                />
                                <Button
                                    disabled={this.state.isBusy}
                                    color="secondary"
                                    onClick={e => this.setState(
                                        { showLocation: !this.state.showLocation }, () => this.saveSettings())}
                                >
                                    {this.state.showLocation ? "Hide" : "Show"} Location
                                </Button>
                            </Fieldset>
                            {this.state.tagValidation && (
                                <Fieldrow>
                                    <div className="danger">{this.state.tagValidation}</div>
                                </Fieldrow>
                            )}
                            {this.state.showLocation && (
                                <Fieldrow>
                                    <div>Click on the map to populate the tag with an IOTA Area Code.</div>
                                    <br />
                                    <AreaCodeMap
                                        disabled={this.state.isBusy}
                                        iac={this.state.tag}
                                        onChanged={iac => this.setState({ tag: iac })}
                                    />
                                </Fieldrow>
                            )}
                            <Fieldset>
                                <label>Network</label>
                                <Select
                                    value={this.state.network}
                                    onChange={e => this.setState({ network: e.target.value as NetworkType })}
                                    selectSize="small"
                                    disabled={this.state.isBusy}
                                >
                                    <option value="mainnet">MainNet</option>
                                    <option value="devnet">DevNet</option>
                                </Select>
                            </Fieldset>
                            <FormActions>
                                <Button
                                    disabled={this.state.isBusy || !this.state.isValid}
                                    onClick={() => this.attachMessage()}
                                >
                                    Attach Message
                                </Button>
                            </FormActions>
                            <FormStatus
                                message={this.state.status}
                                isBusy={this.state.isBusy}
                                isError={this.state.isErrored}
                            />
                            {this.state.transactionHash && (
                                <React.Fragment>
                                    <Fieldrow>
                                        <div className="row-success">
                                            <Success />
                                            <div>The transaction was successfully created.</div>
                                        </div>
                                    </Fieldrow>
                                    <Fieldrow>
                                        <Link
                                            to={`/transaction/${this.state.transactionHash}${network}`}
                                        >
                                            {this.state.transactionHash}
                                        </Link>
                                    </Fieldrow>
                                </React.Fragment>
                            )}
                        </Form>
                    </React.Fragment>
                )}
            </div>
        );
    }

    /**
     * Validate the data
     */
    private validate(): void {
        const addressValidation = isTrytesOfExactLength(this.state.address.toUpperCase(), 81)
            || isTrytesOfExactLength(this.state.address.toUpperCase(), 90) ?
            "" : `The address hash must contain A-Z or 9 and be 81 or 90 trytes in length, it is length ${
            this.state.address.length}`;

        const tagValidation = this.state.tag.length === 0 || isTrytesOfMaxLength(this.state.tag.toUpperCase(), 27) ?
            "" : `The tag hash must contain A-Z or 9 and be a maximum 27 trytes in length, it is length ${
            this.state.tag.length}`;

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
                    const configService = ServiceFactory.get<ConfigurationService<IConfiguration>>
                        ("configuration");

                    const config = configService.get();

                    const nodeConfig = this.state.network === "mainnet"
                        ? config.nodeMainnet : config.nodeDevnet;

                    const api = composeAPI({
                        provider: nodeConfig.provider,
                        attachToTangle: PowHelper.localPow as any
                    });

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

                    const txs = await api.sendTrytes(preparedTrytes, nodeConfig.depth, nodeConfig.mwm);

                    this._tangleCacheService.addTransactions(
                        txs.map(t => t.hash), asTransactionTrytes(txs), this.state.network);

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
     * Save the map settings.
     */
    private async saveSettings(): Promise<void> {
        const settings = await this._settingsService.get();
        settings.isMapExpanded = this.state.showLocation;
        await this._settingsService.save();
    }
}

export default SimpleTransaction;
