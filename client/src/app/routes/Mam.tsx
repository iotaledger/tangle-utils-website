import { MamMode } from "@iota/mam";
import { Button, Fieldrow, Fieldset, Form, FormActions, Heading, Input, Select, Spinner } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../factories/serviceFactory";
import { TrytesHelper } from "../../helpers/trytesHelper";
import { NetworkType } from "../../models/services/networkType";
import { TangleCacheService } from "../../services/tangleCacheService";
import "./Mam.scss";
import { MamProps } from "./MamProps";
import { MamState } from "./MamState";

/**
 * Component for exploring mam.
 */
class Mam extends Component<MamProps, MamState> {
    /**
     * The tangle cache service.
     */
    private readonly _tangleCacheService: TangleCacheService;

    /**
     * Update timer.
     */
    private _updateTimer?: NodeJS.Timer;

    /**
     * Next Root to retrieve from.
     */
    private _nextRoot?: string;

    /**
     * Packet timout.
     */
    private _timeout: number;

    /**
     * Create a new instance of Mam.
     * @param props The props.
     */
    constructor(props: MamProps) {
        super(props);

        this._tangleCacheService = ServiceFactory.get<TangleCacheService>("tangle-cache");

        this._timeout = 500;

        let paramRoot = "";
        let paramMode: MamMode = "public";
        let paramKey = "";
        let paramNetwork: NetworkType = "mainnet";

        if (this.props.match && this.props.match.params) {
            if (this.props.match.params.root) {
                paramRoot = this.props.match.params.root.toUpperCase();
            }
            if (this.props.match.params.mode === "public" ||
                this.props.match.params.mode === "private" ||
                this.props.match.params.mode === "restricted") {
                paramMode = this.props.match.params.mode;
            }
            if (this.props.match.params.key) {
                paramKey = this.props.match.params.key;
            }
            if (this.props.match.params.network === "mainnet" ||
                this.props.match.params.network === "devnet") {
                paramNetwork = this.props.match.params.network;
            }
        }

        this.state = {
            root: paramRoot,
            rootValidation: "",
            mode: paramMode,
            key: paramKey,
            keyValidation: "",
            network: paramNetwork,
            isBusy: false,
            isValid: false,
            packets: []
        };
    }

    /**
     * The component will mount from the dom.
     */
    public async componentWillMount(): Promise<void> {
        if (this.state.root.length > 0) {
            await this.retrieveData();
        }
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        await this.stopData();
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="mam">
                <Heading level={1}>Mam</Heading>
                <Form>
                    <Fieldset>
                        <label>Root</label>
                        <Input
                            type="text"
                            placeholder="The root for the mam channel"
                            value={this.state.root}
                            onChange={e => this.setState({ root: e.target.value }, () => this.validate())}
                            maxLength={81}
                            disabled={this.state.isBusy}
                            restrict="trytes"
                        />
                    </Fieldset>
                    {this.state.rootValidation && (
                        <Fieldrow>
                            <div className="danger">{this.state.rootValidation}</div>
                        </Fieldrow>
                    )}
                    <Fieldset>
                        <label>Mode</label>
                        <Select
                            value={this.state.mode}
                            onChange={e => this.setState({ mode: e.target.value as MamMode }, () => this.validate())}
                            selectSize="small"
                            disabled={this.state.isBusy}
                        >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                            <option value="restricted">Restricted</option>
                        </Select>
                    </Fieldset>
                    <Fieldset>
                        <label>Key</label>
                        <Input
                            type="text"
                            placeholder="The key to use in restricted mode"
                            value={this.state.key}
                            onChange={e => this.setState({ key: e.target.value }, () => this.validate())}
                            maxLength={81}
                            disabled={this.state.isBusy || this.state.mode !== "restricted"}
                        />
                    </Fieldset>
                    {this.state.keyValidation && (
                        <Fieldrow>
                            <div className="danger">{this.state.keyValidation}</div>
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
                            onClick={() => this.retrieveData()}
                        >
                            Retrieve
                        </Button>
                        <Button disabled={!this.state.isBusy} onClick={() => this.stopData()}>Stop</Button>
                    </FormActions>
                </Form>
                {this.state.packets.length > 0 && (
                    <div className="packets">
                        {this.state.packets.map((p, idx) => (
                            <div className="packet" key={idx}>
                                <div className="row">
                                    <div className="label">Root</div>
                                    <div className="root">{p.root}</div>
                                </div>
                                <div className="row">
                                    <div className="label">Message<br />{p.messageType}</div>
                                    <pre className={`payload ${p.messageType.toLowerCase()}`}>{p.message}</pre>
                                </div>
                            </div>
                        ))}
                        {this.state.isBusy && (
                            <div className="busy-row">
                                <Spinner />
                                <div>Waiting for new messages in the channel.</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    /**
     * Validate the transaction hash and load if valid.
     */
    private async retrieveData(): Promise<void> {
        const isValid = this.validate();

        if (isValid) {
            this.setState({ isBusy: true, packets: [] }, async () => {
                this._nextRoot = this.state.root;
                this._timeout = 100;
                await this.loadNextPacket(true);
            });
        }
    }

    /**
     * Stop loading the data.
     */
    private async stopData(): Promise<void> {
        if (this._updateTimer) {
            clearTimeout(this._updateTimer);
            this._updateTimer = undefined;
        }
        this.setState({ isBusy: false });
    }

    /**
     * Load the next packet from the mam channel.
     * @param force Force the read to start.
     */
    private async loadNextPacket(force?: boolean): Promise<void> {
        if (this._nextRoot && (this._updateTimer || force)) {
            const packet = await this._tangleCacheService.getMamPacket(
                this._nextRoot, this.state.mode, this.state.key, this.state.network);

            if (packet) {
                const packets = this.state.packets;
                const decoded = TrytesHelper.decodeMessage(packet.payload);

                packets.push({
                    root: this._nextRoot,
                    nextRoot: packet.nextRoot,
                    payload: packet.payload,
                    message: decoded.message,
                    messageType: decoded.messageType
                });

                this.setState({ packets });

                this._nextRoot = packet.nextRoot;
                this._timeout = 100;
            } else {
                if (this._timeout < 10000) {
                    this._timeout += 500;
                }
            }
            this._updateTimer = setTimeout(async () => this.loadNextPacket(), this._timeout);
        }
    }

    /**
     * Decode the trytes into its fields.
     * @returns True if valid.
     */
    private validate(): boolean {
        let rootValidation = "";
        let keyValidation = "";

        const root = this.state.root.toUpperCase();
        if (root.length > 0) {
            if (root.length !== 81) {
                rootValidation = `The root must be 81 in length, it is ${root.length}.`;
            }

            if (!/^[9A-Z]*$/.test(root)) {
                rootValidation = "Trytes must be characters A-Z or 9.";
            }
        }

        if (this.state.mode === "restricted") {
            if (this.state.key.trim().length === 0) {
                keyValidation = "You must specify a key for restricted mode.";
            }
        }

        this.setState({
            rootValidation,
            keyValidation,
            isValid: rootValidation.length === 0 && keyValidation.length === 0
        });

        return rootValidation.length === 0 && keyValidation.length === 0;
    }
}

export default Mam;
