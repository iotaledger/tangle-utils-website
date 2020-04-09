import { Heading } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IConfiguration } from "../../models/config/IConfiguration";
import { INetworkConfiguration } from "../../models/config/INetworkConfiguration";
import { ApiClient } from "../../services/apiClient";
import { ConfigurationService } from "../../services/configurationService";
import "./Milestones.scss";
import { MilestonesState } from "./MilestonesState";

/**
 * Component which will display milestone feeds.
 */
class Milestones extends Component<any, MilestonesState> {
    /**
     * API Client for remote calls.
     */
    private readonly _apiClient: ApiClient;

    /**
     * Networks.
     */
    private readonly _networks: INetworkConfiguration[];

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
        const configService = ServiceFactory.get<ConfigurationService<IConfiguration>>("configuration");
        this._networks = configService.get().networks;

        this._mounted = false;

        const milestones: {
            [id: string]: {
                /**
                 * The transaction hash.
                 */
                hash: string;
                /**
                 * The milestone index.
                 */
                milestoneIndex: number;
            }[]
        } = {};

        for (const networkConfig of this._networks) {
            milestones[networkConfig.network] = [];
        }

        this.state = {
            milestones
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

        const milestones: {
            [id: string]: {
                /**
                 * The transaction hash.
                 */
                hash: string;
                /**
                 * The milestone index.
                 */
                milestoneIndex: number;
            }[]
        } = {};

        for (const networkConfig of this._networks) {
            milestones[networkConfig.network] = this.state.milestones[networkConfig.network] || [];

            const response = await this._apiClient.getMilestones({ network: networkConfig.network });
            if (response && response.success && this._mounted) {
                milestones[networkConfig.network] = (response.milestones || []).slice(0, 15);
            }
        }

        this.setState({
            milestones
        });
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
                    {this._networks.map((netConfig, idxNetwork) => (
                        <div className="feed" key={netConfig.network}>
                            <Heading level={2}>{netConfig.label}</Heading>
                            {this.state.milestones[netConfig.network].map((mi, idx) => (
                                <div className="row" key={idx}>
                                    <Link
                                        className="small"
                                        to={`/transaction/${mi.hash}${
                                            idxNetwork === 0 ? "" : `/${netConfig.network}`}`
                                        }
                                    >
                                        {mi.hash}
                                    </Link>

                                    <div className="value">{mi.milestoneIndex}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export default Milestones;
