import { LoadBalancerSettings, RandomWalkStrategy } from "@iota/client-load-balancer";
import "iota-css-theme";
import { Footer, GoogleAnalytics, Header, LayoutAppSingle, SideMenu, StatusMessage } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { Link, Route, RouteComponentProps, Switch, withRouter } from "react-router-dom";
import logo from "../assets/logo.svg";
import contentHomePage from "../content/contentHomePage.json";
import { ServiceFactory } from "../factories/serviceFactory";
import { IConfiguration } from "../models/config/IConfiguration";
import { ConfigurationService } from "../services/configurationService";
import { LocalStorageService } from "../services/localStorageService";
import { SettingsService } from "../services/settingsService";
import { TangleCacheService } from "../services/tangleCacheService";
import { TransactionsClient } from "../services/transactionsClient";
import { AppState } from "./AppState";
import Compress from "./routes/Compress";
import { CompressProps } from "./routes/CompressProps";
import CurrencyConversion from "./routes/CurrencyConversion";
import Explore from "./routes/Explore";
import { ExploreProps } from "./routes/ExploreProps";
import ExploreView from "./routes/ExploreView";
import { ExploreViewProps } from "./routes/ExploreViewProps";
import Mam from "./routes/Mam";
import { MamProps } from "./routes/MamProps";
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
     * The settings service.
     */
    private _settingsService!: SettingsService;

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
            const configService = new ConfigurationService<IConfiguration>();
            const configId = process.env.REACT_APP_CONFIG_ID || "local";
            const config = await configService.load(`/data/config.${configId}.json`);

            ServiceFactory.register("configuration", () => configService);
            ServiceFactory.register("local-storage", () => new LocalStorageService());
            ServiceFactory.register("tangle-cache", () => new TangleCacheService());
            ServiceFactory.register("transactions", () => new TransactionsClient(config.apiEndpoint));

            const loadBalancerSettingsMainNet: LoadBalancerSettings = {
                nodeWalkStrategy: new RandomWalkStrategy(config.nodesMainnet),
                timeoutMs: 30000
            };
            ServiceFactory.register("load-balancer-mainnet", () => loadBalancerSettingsMainNet);

            const loadBalancerSettingsDevNet: LoadBalancerSettings = {
                nodeWalkStrategy: new RandomWalkStrategy(config.nodesDevnet),
                timeoutMs: 30000
            };
            ServiceFactory.register("load-balancer-devnet", () => loadBalancerSettingsDevNet);

            this._settingsService = new SettingsService();
            ServiceFactory.register("settings", () => this._settingsService);

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
                    title="IOTA Tangle Utils"
                    topLinks={contentHomePage.headerTopLinks}
                    logo={logo}
                    compact={true}
                    hamburgerClick={() => this.setState({ isSideMenuOpen: !this.state.isSideMenuOpen })}
                    hamburgerMediaQuery="tablet-up-hidden"
                />
                <nav className="tablet-down-hidden">
                    <Link className="link" to="/">Explore</Link>
                    <Link className="link" to="/mam">Mam</Link>
                    <Link className="link" to="/currency-conversion">Currency Conversion</Link>
                    <Link className="link" to="/text-conversion">Text Conversion</Link>
                    <Link className="link" to="/transaction-decoder">Transaction Decoder</Link>
                    <Link className="link" to="/compress">Compress</Link>
                    <Link className="link" to="/qr-create">QR Create</Link>
                    <Link className="link" to="/qr-scan">QR Scan</Link>
                    <Link className="link" to="/simple-transaction">Simple Transaction</Link>
                </nav>
                <SideMenu
                    isMenuOpen={this.state.isSideMenuOpen}
                    handleClose={() => this.setState({ isSideMenuOpen: false })}
                    history={this.props.history}
                    items={[
                        {
                            name: "IOTA Tangle Utils",
                            isExpanded: true,
                            items: [
                                {
                                    items: [
                                        {
                                            name: "Explore",
                                            link: "/"
                                        },
                                        {
                                            name: "Mam",
                                            link: "/mam"
                                        },
                                        {
                                            name: "Currency Conversion",
                                            link: "/currency-conversion"
                                        },
                                        {
                                            name: "Text Conversion",
                                            link: "/text-conversion"
                                        },
                                        {
                                            name: "Transaction Decoder",
                                            link: "/transaction-decoder"
                                        },
                                        {
                                            name: "Compress",
                                            link: "/compress"
                                        },
                                        {
                                            name: "QR Create",
                                            link: "/qr-create"
                                        },
                                        {
                                            name: "QR Scan",
                                            link: "/qr-scan"
                                        },
                                        {
                                            name: "Simple Transaction",
                                            link: "/simple-transaction"
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
                        <StatusMessage status={this.state.status} color={this.state.statusColor} isBusy={this.state.isBusy} />
                        {!this.state.status && (
                            <Switch>
                                <Route
                                    exact={true}
                                    path="/"
                                    component={(props: ExploreProps) => (<Explore {...props} bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/transaction/:hash?/:network?"
                                    component={(props: ExploreViewProps) => (<ExploreView {...props} hashType="transaction" bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/bundle/:hash?/:network?"
                                    component={(props: ExploreViewProps) => (<ExploreView {...props} hashType="bundle" bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/address/:hash?/:network?"
                                    component={(props: ExploreViewProps) => (<ExploreView {...props} hashType="address" bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/tag/:hash?/:network?"
                                    component={(props: ExploreViewProps) => (<ExploreView {...props} hashType="tag" bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/mam/:root?/:mode?/:key?/:network?"
                                    component={(props: MamProps) => (<Mam {...props} bust={Date.now()} />)}
                                />
                                <Route exact={true} path="/currency-conversion" component={() => (<CurrencyConversion bust={Date.now()} />)} />
                                <Route
                                    exact={true}
                                    path="/text-conversion/:plainTextOrTrytes?"
                                    component={(props: TextConversionProps) => (<TextConversion {...props} bust={Date.now()} />)}
                                />
                                <Route
                                    exact={true}
                                    path="/transaction-decoder/:trytes?/:network?"
                                    component={(props: TransactionDecoderProps) => (<TransactionDecoder {...props} bust={Date.now()} />)}
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
                                <Route exact={true} path="/simple-transaction" component={() => (<SimpleTransaction bust={Date.now()} />)} />
                            </Switch>
                        )}
                    </LayoutAppSingle>
                </section>
                <Footer history={this.props.history} sections={contentHomePage.footerSections} staticContent={contentHomePage.footerStaticContent} />
                <GoogleAnalytics id={this._configuration && this._configuration.googleAnalyticsId} />
            </React.Fragment>
        );
    }
}

export default withRouter(App);
