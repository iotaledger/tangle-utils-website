import { Transaction } from "@iota/core";
import { Button, ClipboardHelper, StatusMessage } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { UnitsHelper } from "../../helpers/unitsHelper";
import { IConfiguration } from "../../models/config/IConfiguration";
import { INetworkConfiguration } from "../../models/config/INetworkConfiguration";
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
    private readonly _networks: INetworkConfiguration[];

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
            transactions: ReadonlyArray<{
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
            bundleGroups.push({
                transactions: bundleGroupsPlain[i].map(t => ({
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
                        for (let k = 0; k < bundleGroups[i].transactions.length; k++) {
                            const tx = bundleGroups[i].transactions[k].transaction;
                            const converted = await this._currencyService.currencyConvert(
                                tx.value,
                                currencyData,
                                false);
                            bundleGroups[i].transactions[k].currencyConverted =
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
                                Inputs [{group.transactions.filter(f => f.transaction.value < 0).length}]
                            </div>
                            {group.transactions.filter(f => f.transaction.value < 0).map((t, idx2) => (
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
                            {group.transactions.filter(f => f.transaction.value > 0).length === 0 && (
                                <div>None</div>
                            )}
                        </div>
                        <div className="outputs">
                            <div className="caption-wrapper">
                                <div
                                    className="caption"
                                >
                                    Outputs [{group.transactions.filter(f => f.transaction.value >= 0).length}]
                                </div>
                                <Confirmation state={group.confirmationState} />
                            </div>
                            {group.transactions.filter(f => f.transaction.value >= 0).map((t, idx2) => (
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
                            {group.transactions.filter(f => f.transaction.value <= 0).length === 0 && (
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
