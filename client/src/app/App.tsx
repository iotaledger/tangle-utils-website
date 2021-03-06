import "iota-css-theme";
import { Footer, FoundationDataHelper, GoogleAnalytics, Header, Heading, LayoutAppSingle, SideMenu, StatusMessage } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link, Route, RouteComponentProps, Switch, withRouter } from "react-router-dom";
import logo from "../assets/logo.svg";
import { ServiceFactory } from "../factories/serviceFactory";
import { IConfiguration } from "../models/config/IConfiguration";
import { ConfigurationService } from "../services/configurationService";
import { AppState } from "./AppState";
import AreaCodes from "./routes/AreaCodes";
import { AreaCodesProps } from "./routes/AreaCodesProps";
import Compress from "./routes/Compress";
import { CompressProps } from "./routes/CompressProps";
import QRCreate from "./routes/QRCreate";
import { QRCreateProps } from "./routes/QRCreateProps";
import QRScan from "./routes/QRScan";
import SimpleTransaction from "./routes/SimpleTransaction";
import TextConversion from "./routes/TextConversion";
import { TextConversionProps } from "./routes/TextConversionProps";
import TransactionDecoder from "./routes/TransactionDecoder";
import { TransactionDecoderProps } from "./routes/TransactionDecoderProps";

/**
 * Main application class.
 */
class App extends Component<RouteComponentProps, AppState> {
    /**
     * The configuration for the app.
     */
    private _configuration?: IConfiguration;

    /**
     * Create a new instance of App.
     * @param props The props.
     */
    constructor(props: any) {
        super(props);

        this.state = {
            isBusy: true,
            status: "Loading Configuration...",
            statusColor: "info",
            isSideMenuOpen: false
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        try {
            this.setState({ foundationData: await FoundationDataHelper.loadData() });

            const configService = new ConfigurationService<IConfiguration>();
            const configId = process.env.REACT_APP_CONFIG_ID || "local";
            const config = await configService.load(`/data/config.${configId}.json`);

            ServiceFactory.register("configuration", () => configService);

            ServiceFactory.register("network-config", () => config.networks);

            this._configuration = config;

            this.setState({
                isBusy: false,
                status: "",
                statusColor: "success"
            });
        } catch (err) {
            this.setState({
                isBusy: false,
                status: err.message,
                statusColor: "danger"
            });
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <React.Fragment>
                <Header
                    title="IOTA Tangle Utilities"
                    foundationData={this.state.foundationData}
                    logo={logo}
                    compact={true}
                    hamburgerClick={() => this.setState({ isSideMenuOpen: !this.state.isSideMenuOpen })}
                    hamburgerMediaQuery="tablet-up-hidden"
                />
                <nav className="tablet-down-hidden">
                    <Link className="link" to="/">Home</Link>
                    <Link className="link" to="/text-conversion">Text Converter</Link>
                    <Link className="link" to="/transaction-decoder">Transaction Decoder</Link>
                    <Link className="link" to="/compress">Trytes Compressor</Link>
                    <Link className="link" to="/qr-create">QR Code Generator</Link>
                    <Link className="link" to="/qr-scan">QR Code Scanner</Link>
                    <Link className="link" to="/simple-transaction">Simple Transaction Sender</Link>
                    <Link className="link" to="/area-codes">Area Code Finder</Link>
                </nav>
                <SideMenu
                    isMenuOpen={this.state.isSideMenuOpen}
                    handleClose={() => this.setState({ isSideMenuOpen: false })}
                    history={this.props.history}
                    items={[
                        {
                            name: "IOTA Tangle Utilities",
                            isExpanded: true,
                            items: [
                                {
                                    items: [
                                        {
                                            name: "Text Converter",
                                            link: "/text-conversion"
                                        },
                                        {
                                            name: "Transaction Decoder",
                                            link: "/transaction-decoder"
                                        },
                                        {
                                            name: "Trytes Compressor",
                                            link: "/compress"
                                        },
                                        {
                                            name: "QR Code Generator",
                                            link: "/qr-create"
                                        },
                                        {
                                            name: "QR Code Scanner",
                                            link: "/qr-scan"
                                        },
                                        {
                                            name: "Simple Transaction Sender",
                                            link: "/simple-transaction"
                                        },
                                        {
                                            name: "Area Code Finder",
                                            link: "/area-codes"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]}
                    selectedItemLink={this.props.location.pathname}
                    mediaQuery="tablet-up-hidden"
                />
                <section className="content">
                    <LayoutAppSingle>
                        <StatusMessage
                            status={this.state.status}
                            color={this.state.statusColor}
                            isBusy={this.state.isBusy}
                        />
                        {!this.state.status && (
                            <Switch>
                                <Route
                                    exact={true}
                                    path="/"
                                    component={() => (<div className="explore">
                                        <Heading level={1}>Tangle Explorer</Heading>
                                        <p>The explorer has moved to&nbsp;
                                            <a href="https://explorer.iota.org">explorer.iota.org</a>
                                            <br />
                                            <br />
                                            Streams v0 (MAM) Decoder:&nbsp;
                                            <a href="https://explorer.iota.org/mainnet/streams/0/">
                                                explorer.iota.org/mainnet/streams/0/
                                            </a>
                                            <br />
                                            <br />
                                            Currency Conversion:&nbsp;
                                            <a href="https://explorer.iota.org/mainnet/currency-converter/">
                                                explorer.iota.org/mainnet/currency-converter/
                                            </a>
                                        </p>
                                    </div>)}
                                />
                                <Route
                                    exact={true}
                                    path="/transaction/:hash?/:network?"
                                    component={(props: RouteComponentProps<{
                                        /**
                                         * Transaction hash.
                                         */
                                        hash?: string;
                                        /**
                                         * Network.
                                         */
                                        network?: string
                                    }>) => {
                                        window.location.href = props.match.params.hash && props.match.params.network
                                            ? `https://explorer.iota.org/${props.match.params.network}/transaction/${props.match.params.hash}`
                                            : "https://explorer.iota.org/";
                                        return null;
                                    }} />
                                <Route
                                    exact={true}
                                    path="/bundle/:hash?/:network?"
                                    component={(props: RouteComponentProps<{
                                        /**
                                         * Bundle hash.
                                         */
                                        hash?: string;
                                        /**
                                         * Network.
                                         */
                                        network?: string
                                    }>) => {
                                        window.location.href = props.match.params.hash && props.match.params.network
                                            ? `https://explorer.iota.org/${props.match.params.network}/bundle/${props.match.params.hash}`
                                            : "https://explorer.iota.org/";
                                        return null;
                                    }} />
                                <Route
                                    exact={true}
                                    path="/address/:hash?/:network?"
                                    component={(props: RouteComponentProps<{
                                        /**
                                         * Address hash.
                                         */
                                        hash?: string;
                                        /**
                                         * Network.
                                         */
                                        network?: string
                                    }>) => {
                                        window.location.href = props.match.params.hash && props.match.params.network
                                            ? `https://explorer.iota.org/${props.match.params.network}/address/${props.match.params.hash}`
                                            : "https://explorer.iota.org/";
                                        return null;
                                    }} />
                                <Route
                                    exact={true}
                                    path="/bundle/:hash?/:network?"
                                    component={(props: RouteComponentProps<{
                                        /**
                                         * Tag hash.
                                         */
                                        hash?: string;
                                        /**
                                         * Network.
                                         */
                                        network?: string
                                    }>) => {
                                        window.location.href = props.match.params.hash && props.match.params.network
                                            ? `https://explorer.iota.org/${props.match.params.network}/tag/${props.match.params.hash}`
                                            : "https://explorer.iota.org/";
                                        return null;
                                    }} />
                                <Route
                                    exact={true}
                                    path="/mam"
                                    component={() => (<div className="explore">
                                        <Heading level={1}>MAM Subscriber</Heading>
                                        <p>The MAM Subscriber has moved to&nbsp;
                                            <a href="https://explorer.iota.org/mainnet/streams/0/">
                                                explorer.iota.org/mainnet/streams/0/</a>
                                        </p>
                                    </div>)}
                                />
                                <Route
                                    exact={true}
                                    path="/mam/:root?/:mode?/:key?/:network"
                                    component={(props: RouteComponentProps<{
                                        /**
                                         * Root hash.
                                         */
                                        root?: string;
                                        /**
                                         * Mode.
                                         */
                                        mode?: string;
                                        /**
                                         * Key.
                                         */
                                        key?: string;
                                        /**
                                         * Network.
                                         */
                                        network?: string
                                    }>) => {
                                        window.location.href = props.match.params.root &&
                                            props.match.params.mode &&
                                            props.match.params.key && props.match.params.network
                                            ? `https://explorer.iota.org/${props.match.params.network}/streams/0/${props.match.params.root}/${props.match.params.mode}/${props.match.params.key}`
                                            : "https://explorer.iota.org/mainnet/streams/0/";
                                        return null;
                                    }} />
                                <Route
                                    exact={true}
                                    path="/currency-conversion"
                                    component={() => (<div className="explore">
                                        <Heading level={1}>Currency Conversion</Heading>
                                        <p>The currency conversion has moved to&nbsp;
                                        <a href="https://explorer.iota.org/mainnet/currency-converter">
                                                explorer.iota.org/mainnet/currency-converter
                                        </a>
                                        </p>
                                    </div>
                                    )}
                                />
                                <Route
                                    exact={true}
                                    path="/text-conversion/:plainTextOrTrytes?"
                                    component={(props: TextConversionProps) =>
                                        (<TextConversion {...props} bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/transaction-decoder/:trytes?/:network?"
                                    component={(props: TransactionDecoderProps) =>
                                        (<TransactionDecoder {...props} bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/compress/:trytes?/:network?"
                                    component={(props: CompressProps) => (<Compress {...props} bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/qr-create/:address?/:amount?/:message?"
                                    component={(props: QRCreateProps) => (<QRCreate {...props} bust={Date.now()} />)}
                                />
                                <Route exact={true} path="/qr-scan" component={() => (<QRScan bust={Date.now()} />)} />
                                <Route
                                    exact={true}
                                    path="/simple-transaction"
                                    component={() => (<SimpleTransaction bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/area-codes/:iac?"
                                    component={(props: AreaCodesProps) => (<AreaCodes {...props} bust={Date.now()} />)}
                                />
                            </Switch>
                        )}
                    </LayoutAppSingle>
                </section>
                <Footer
                    history={this.props.history}
                    sections={[
                        {
                            heading: "IOTA Tangle Utilities",
                            links: [
                                {
                                    href: "/",
                                    text: "Home"
                                },
                                {
                                    href: "https://explorer.iota.org",
                                    text: "Explorer"
                                },
                                {
                                    href: "https://explorer.iota.org/mainnet/currency-converter",
                                    text: "Currency Converter"
                                },
                                {
                                    href: "/text-conversion",
                                    text: "Text Converter"
                                },
                                {
                                    href: "/transaction-decoder",
                                    text: "Transaction Decoder"
                                },
                                {
                                    href: "/compress",
                                    text: "Trytes Compressor"
                                },
                                {
                                    href: "/qr-create",
                                    text: "QR Code Generator"
                                },
                                {
                                    href: "/qr-scan",
                                    text: "QR Code Scanner"
                                },
                                {
                                    href: "/simple-transaction",
                                    text: "Simple Transaction Sender"
                                },
                                {
                                    href: "/area-codes",
                                    text: "Area Code Finder"
                                }
                            ]
                        }
                    ]}
                    foundationData={this.state.foundationData}
                />
                <GoogleAnalytics id={this._configuration && this._configuration.googleAnalyticsId} />
            </React.Fragment>
        );
    }
}

export default withRouter(App);
