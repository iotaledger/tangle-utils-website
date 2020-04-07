import { Heading } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { ApiClient } from "../../services/apiClient";
import "./Milestones.scss";
import { MilestonesState } from "./MilestonesState";

/**
 * Component which will display transactions feeds.
 */
class Milestones extends Component<any, MilestonesState> {
    /**
     * API Client for remote calls.
     */
    private readonly _apiClient: ApiClient;

    /**
     * Is the component mounted.
     */
    private _mounted: boolean;

    /**
     * Create a new instance of Milestones.
     * @param props The props.
     */
    constructor(props: any) {
        super(props);

        this._apiClient = ServiceFactory.get<ApiClient>("api-client");
        this._mounted = false;

        this.state = {
            mainnetMilestones: [],
            devnetMilestones: []
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

        const mainNetResponse = await this._apiClient.getMilestones({ network: "mainnet" });
        if (mainNetResponse && mainNetResponse.success) {
            if (this._mounted) {
                this.setState({
                    mainnetMilestones: (mainNetResponse.milestones || []).slice(0, 15)
                });
            }
        }

        const devNetResponse = await this._apiClient.getMilestones({ network: "devnet" });
        if (devNetResponse && devNetResponse.success) {
            if (this._mounted) {
                this.setState({
                    devnetMilestones: (devNetResponse.milestones || []).slice(0, 15)
                });
            }
        }
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="milestones">
                <div className="feed-wrapper">
                    <div className="feed">
                        <Heading level={2}>MainNet</Heading>
                        {this.state.mainnetMilestones.map((mi, idx) => (
                            <div className="row" key={idx}>
                                <Link className="small" to={`/transaction/${mi.hash}`}>{mi.hash}</Link>
                                <div className="value">{mi.milestoneIndex}</div>
                            </div>
                        ))}
                    </div>
                    <div className="feed">
                        <Heading level={2}>DevNet</Heading>
                        {this.state.devnetMilestones.map((mi, idx) => (
                            <div className="row" key={idx}>
                                <Link className="small" to={`/transaction/${mi.hash}/devnet`}>{mi.hash}</Link>
                                <div className="value">{mi.milestoneIndex}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
}

export default Milestones;
