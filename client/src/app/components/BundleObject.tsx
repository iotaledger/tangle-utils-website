import { Transaction } from "@iota/transaction-converter";
import { Button, ClipboardHelper, StatusMessage } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { UnitsHelper } from "../../helpers/unitsHelper";
import { ConfirmationState } from "../../models/confirmationState";
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
     * Create a new instance of BundleObject.
     * @param props The props.
     */
    constructor(props: BundleObjectProps) {
        super(props);

        this._tangleCacheService = ServiceFactory.get<TangleCacheService>("tangle-cache");

        this.state = {
            bundleGroups: [],
            isBusy: true
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        const bundleGroupsPlain = await this._tangleCacheService.getBundleGroups(this.props.transactionHashes, this.props.network);

        const confirmationStates = await this._tangleCacheService.getTransactionConfirmationStates(
            bundleGroupsPlain.map(group => group[0].hash),
            this.props.network
        );

        const confirmedIndex = confirmationStates.indexOf("confirmed");

        const bundleGroups: {
            /**
             * The confirmation state for the group.
             */
            confirmationState: ConfirmationState;
            /**
             * The transactions in the group.
             */
            transactions: ReadonlyArray<Transaction>;
        }[] = [];

        for (let i = 0; i < confirmationStates.length; i++) {
            bundleGroups.push({
                transactions: bundleGroupsPlain[i],
                confirmationState: confirmedIndex === i ? confirmationStates[i] :
                    confirmedIndex >= 0 && confirmationStates[i] !== "confirmed" ? "reattachment" : confirmationStates[i]
            });
        }

        this.setState({ bundleGroups, isBusy: false });
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        const network = this.props.network === "mainnet" ? "" : `/${this.props.network}`;

        return (
            <div className="transaction-object bundle-object">
                <div className="row">
                    <div className="value">{this.props.hash}</div>
                    <Button color="secondary" size="small" onClick={() => ClipboardHelper.copy(this.props.hash)}>Copy</Button>
                </div>
                {this.state.isBusy && (
                    <StatusMessage status="Loading bundle data, please wait..." color="info" isBusy={this.state.isBusy} />
                )}
                {this.state.bundleGroups.map((group, idx) => (
                    <div className="group" key={idx}>
                        <div className="inputs">
                            <div className="caption">Inputs</div>
                            {group.transactions.filter(f => f.value < 0).map((t, idx2) => (
                                <div className="transaction" key={idx2}>
                                    <div className="row top">
                                        <div className="label">Hash</div>
                                        <div className="value"><Link className="small" to={`/transaction/${t.hash}${network}`}>{t.hash}</Link></div>
                                    </div>
                                    <div className="row top">
                                        <div className="label">Value</div>
                                        <div className="value">{UnitsHelper.formatBest(t.value)}</div>
                                    </div>
                                </div>
                            ))}
                            {group.transactions.filter(f => f.value > 0).length === 0 && (
                                <div>None</div>
                            )}
                        </div>
                        <div className="outputs">
                            <div className="caption-wrapper">
                                <div className="caption">Outputs</div>
                                <Confirmation state={group.confirmationState} />
                            </div>
                            {group.transactions.filter(f => f.value >= 0).map((t, idx2) => (
                                <div className="transaction" key={idx2}>
                                    <div className="row top">
                                        <div className="label">Hash</div>
                                        <div className="value"><Link className="nav-link small" to={`/transaction/${t.hash}${network}`}>{t.hash}</Link></div>
                                    </div>
                                    <div className="row top">
                                        <div className="label">Value</div>
                                        <div className="value">{UnitsHelper.formatBest(t.value)}</div>
                                    </div>
                                </div>
                            ))}
                            {group.transactions.filter(f => f.value <= 0).length === 0 && (
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
