import { Transaction } from "@iota/core";
import { Button, ClipboardHelper, StatusMessage } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { UnitsHelper } from "../../helpers/unitsHelper";
import { IClientNetworkConfiguration } from "../../models/config/IClientNetworkConfiguration";
import { IConfiguration } from "../../models/config/IConfiguration";
import { ConfirmationState } from "../../models/confirmationState";
import { ConfigurationService } from "../../services/configurationService";
import { CurrencyService } from "../../services/currencyService";
import { TangleCacheService } from "../../services/tangleCacheService";
import "./BundleObject.scss";
import { BundleObjectProps } from "./BundleObjectProps";
import { BundleObjectState } from "./BundleObjectState";
import Confirmation from "./Confirmation";
import "./TransactionObject.scss";

/**
 * Component which will display a bundle.
 */
class BundleObject extends Component<BundleObjectProps, BundleObjectState> {
    /**
     * The tangle cache service.
     */
    private readonly _tangleCacheService: TangleCacheService;

    /**
     * Networks.
     */
    private readonly _networks: IClientNetworkConfiguration[];

    /**
     * The currency service.
     */
    private readonly _currencyService: CurrencyService;

    /**
     * Create a new instance of BundleObject.
     * @param props The props.
     */
    constructor(props: BundleObjectProps) {
        super(props);

        this._tangleCacheService = ServiceFactory.get<TangleCacheService>("tangle-cache");
        this._currencyService = ServiceFactory.get<CurrencyService>("currency");

        const configService = ServiceFactory.get<ConfigurationService<IConfiguration>>("configuration");
        this._networks = configService.get().networks;

        this.state = {
            bundleGroups: [],
            isBusy: true
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        const bundleGroupsPlain = await this._tangleCacheService.getBundleGroups(
            this.props.transactionHashes, this.props.network);

        const confirmationStates = bundleGroupsPlain.map(bg => bg[0].confirmationState);

        const confirmedIndex = confirmationStates.indexOf("confirmed");

        const bundleGroups: {
            /**
             * The confirmation state for the group.
             */
            confirmationState: ConfirmationState;
            /**
             * The transactions in the group.
             */
            inputs: ReadonlyArray<{
                /**
                 * The transaction.
                 */
                transaction: Transaction;
                /**
                 * The value converted.
                 */
                currencyConverted: string;
            }>;
            /**
             * The transactions in the group.
             */
            outputs: ReadonlyArray<{
                /**
                 * The transaction.
                 */
                transaction: Transaction;
                /**
                 * The value converted.
                 */
                currencyConverted: string;
            }>;
        }[] = [];

        for (let i = 0; i < confirmationStates.length; i++) {
            const inputAddresses = bundleGroupsPlain[i].filter(tx => tx.tx.value < 0).map(t => t.tx.address);

            bundleGroups.push({
                inputs: bundleGroupsPlain[i].filter(t => inputAddresses.includes(t.tx.address)).map(t => ({
                    transaction: t.tx,
                    currencyConverted: ""
                })),
                outputs: bundleGroupsPlain[i].filter(t => !inputAddresses.includes(t.tx.address)).map(t => ({
                    transaction: t.tx,
                    currencyConverted: ""
                })),
                confirmationState: confirmedIndex === i ? confirmationStates[i] :
                    confirmedIndex >= 0 && confirmationStates[i] !== "confirmed"
                        ? "reattachment" : confirmationStates[i]
            });
        }
        this.setState({ bundleGroups, isBusy: false });

        await this._currencyService.loadCurrencies((isAvailable, currencyData, err) => {
            if (isAvailable && currencyData) {
                this.setState({ currencyData }, async () => {
                    for (let i = 0; i < bundleGroups.length; i++) {
                        for (let k = 0; k < bundleGroups[i].inputs.length; k++) {
                            const tx = bundleGroups[i].inputs[k].transaction;
                            const converted = await this._currencyService.currencyConvert(
                                tx.value,
                                currencyData,
                                false);
                            bundleGroups[i].inputs[k].currencyConverted =
                                `${currencyData.fiatCode} ${converted}`;
                        }
                        for (let k = 0; k < bundleGroups[i].outputs.length; k++) {
                            const tx = bundleGroups[i].outputs[k].transaction;
                            const converted = await this._currencyService.currencyConvert(
                                tx.value,
                                currencyData,
                                false);
                            bundleGroups[i].outputs[k].currencyConverted =
                                `${currencyData.fiatCode} ${converted}`;
                        }
                    }
                    this.setState({ bundleGroups });
                });
            }
        });
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const network = this.props.network === this._networks[0].network ? "" : `/${this.props.network}`;

        return (
            <div className="transaction-object bundle-object">
                <div className="row">
                    <div className="value">{this.props.hash}</div>
                    <Button
                        color="secondary"
                        size="small"
                        onClick={() => ClipboardHelper.copy(this.props.hash)}
                    >
                        Copy
                    </Button>
                </div>
                {this.state.isBusy && (
                    <StatusMessage
                        status="Loading bundle data, please wait..."
                        color="info"
                        isBusy={this.state.isBusy}
                    />
                )}
                {this.state.bundleGroups.map((group, idx) => (
                    <div className="group" key={idx}>
                        <div className="inputs">
                            <div
                                className="caption"
                            >
                                Inputs [{group.inputs.length}]
                            </div>
                            {group.inputs.map((t, idx2) => (
                                <div className="transaction" key={idx2}>
                                    <div className="row top">
                                        <div className="label">Hash</div>
                                        <div className="value">
                                            <Link
                                                className="nav-link small"
                                                to={`/transaction/${t.transaction.hash}${network}`}
                                            >
                                                {t.transaction.hash}
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="row top">
                                        <div className="label">Value</div>
                                        <div className="value">{UnitsHelper.formatBest(t.transaction.value)}</div>
                                    </div>
                                    {t.currencyConverted && (
                                        <div className="row top">
                                            <div className="label">Currency</div>
                                            <div className="value">{t.currencyConverted}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {group.inputs.length === 0 && (
                                <div>None</div>
                            )}
                        </div>
                        <div className="outputs">
                            <div className="caption-wrapper">
                                <div
                                    className="caption"
                                >
                                    Outputs [{group.outputs.length}]
                                </div>
                                <Confirmation state={group.confirmationState} />
                            </div>
                            {group.outputs.map((t, idx2) => (
                                <div className="transaction" key={idx2}>
                                    <div className="row top">
                                        <div className="label">Hash</div>
                                        <div className="value">
                                            <Link
                                                className="nav-link small"
                                                to={`/transaction/${t.transaction.hash}${network}`}
                                            >
                                                {t.transaction.hash}
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="row top">
                                        <div className="label">Value</div>
                                        <div className="value">{UnitsHelper.formatBest(t.transaction.value)}</div>
                                    </div>
                                    {t.currencyConverted && (
                                        <div className="row top">
                                            <div className="label">Currency</div>
                                            <div className="value">{t.currencyConverted}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {group.outputs.length === 0 && (
                                <div>None</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
}

export default BundleObject;
