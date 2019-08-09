import * as IotaAreaCodes from "@iota/area-codes";
import GoogleMapReact, { ClickEventValue } from "google-map-react";
import { Button, Spinner } from "iota-react-components";
import React, { Component, ReactNode } from "react";
import { ServiceFactory } from "../../factories/serviceFactory";
import { IConfiguration } from "../../models/config/IConfiguration";
import { ConfigurationService } from "../../services/configurationService";
import { SettingsService } from "../../services/settingsService";
import "./AreaCodeMap.scss";
import { AreaCodeMapProps } from "./AreaCodeMapProps";
import { AreaCodeMapState } from "./AreaCodeMapState";

/**
 * Component which will show simple area codes.
 */
class AreaCodeMap extends Component<AreaCodeMapProps, AreaCodeMapState> {
    /**
     * The default longitude for map.
     */
    private readonly DEFAULT_LONGITUDE: number = 13.413047;

    /**
     * The default latitude for map.
     */
    private readonly DEFAULT_LATITUDE: number = 52.529562;

    /**
     * The default zoom for map.
     */
    private readonly DEFAULT_ZOOM: number = 17;

    /**
     * The service to store settings.
     */
    private readonly _settingsService: SettingsService;

    /**
     * The configuration.
     */
    private readonly _configuration: IConfiguration;

    /**
     * The map object.
     */
    private _map: any;

    /**
     * The maps object.
     */
    private _maps: any;

    /**
     * Map highlight polygon.
     */
    private _highlight: any;

    /**
     * Is the component mounted.
     */
    private _mounted: boolean;

    /**
     * Create a new instance of AreaCodeMap.
     * @param props The props.
     */
    constructor(props: AreaCodeMapProps) {
        super(props);

        this._configuration = ServiceFactory.get<ConfigurationService<IConfiguration>>("configuration").get();
        this._settingsService = ServiceFactory.get<SettingsService>("settings");
        this._mounted = false;

        this.state = {
            areaCode: this.props.iac,
            apiLoaded: false,
            findingLocation: false
        };
    }

    /**
     * The component mounted.
     */
    public async componentDidMount(): Promise<void> {
        this._mounted = true;

        const settings = await this._settingsService.get();

        if (settings.longitude && settings.latitude && this._mounted) {
            const iac = IotaAreaCodes.encode(
                settings.latitude,
                settings.longitude,
                IotaAreaCodes.CodePrecision.NORMAL
            );
            this.setState(
                {
                    areaCode: iac,
                    zoom: settings.zoom || this.DEFAULT_ZOOM
                },
                async () => {
                    if (this.state.apiLoaded) {
                        await this.updateIac(this.state.areaCode);
                    }
                });
        }
    }

    /**
     * The component will unmount from the dom.
     */
    public async componentWillUnmount(): Promise<void> {
        this._mounted = false;
    }

    /**
     * The component performed an update.
     * @param prevProps The previous properties.
     */
    public async componentDidUpdate(prevProps: AreaCodeMapProps): Promise<void> {
        if (prevProps.iac !== this.props.iac && this.props.iac) {
            this.setState(
                {
                    areaCode: this.props.iac
                },
                async () => {
                    if (this.state.apiLoaded) {
                        await this.updateIac(this.state.areaCode, true);
                    }
                });
        }
    }

    /**
     * Render the component.
     * @returns The node to render.
     */
    public render(): ReactNode {
        return (
            <div className="area-code-map">
                <div className="area-code-map--map-container">
                    {!this.state.apiLoaded && (
                        <Spinner />
                    )}
                    {this.props.disabled && (
                        <div className="area-code-map--disabled-overlay" />
                    )}
                    <GoogleMapReact
                        bootstrapURLKeys={{ key: this._configuration.googleMapsKey }}
                        defaultCenter={{
                            lat: this.DEFAULT_LATITUDE,
                            lng: this.DEFAULT_LONGITUDE
                        }}
                        center={{
                            lat: this.state.latitude || this.DEFAULT_LATITUDE,
                            lng: this.state.longitude || this.DEFAULT_LONGITUDE
                        }}
                        defaultZoom={this.DEFAULT_ZOOM}
                        zoom={this.state.zoom || this.DEFAULT_ZOOM}
                        onClick={e => this.mapClicked(e)}
                        onGoogleApiLoaded={e => this.apiLoaded(e.map, e.maps)}
                        yesIWantToUseGoogleMapApiInternals={true}
                        onChange={e => this.setState({ zoom: e.zoom }, () => this.saveSettings())}
                    />
                </div>
                <div className="area-code-map--actions">
                    <Button
                        disabled={this.props.disabled}
                        onClick={
                            () => this.setState(
                                { zoom: this.DEFAULT_ZOOM },
                                () => this.updateIac(
                                    IotaAreaCodes.encode(
                                        this.DEFAULT_LATITUDE,
                                        this.DEFAULT_LONGITUDE,
                                        IotaAreaCodes.CodePrecision.NORMAL
                                    ))
                            )}
                    >
                        Reset
                    </Button>
                    <Button
                        disabled={this.props.disabled}
                        onClick={() => this.getLocation()}
                    >
                        My Location
                    </Button>
                    {this.state.findingLocation && (
                        <Spinner size="small" />
                    )}
                </div>
            </div >
        );
    }

    /**
     * The google maps api was loaded capture the maps and map object.
     * @param map The map object.
     * @param maps The maps object.
     */
    private async apiLoaded(map: any, maps: any): Promise<void> {
        this._map = map;
        this._maps = maps;

        this.setState({ apiLoaded: true }, async () => {
            await this.updateIac(this.state.areaCode);
        });
    }

    /**
     * The map was clicked.
     * @param event The click event.
     */
    private async mapClicked(event: ClickEventValue): Promise<void> {
        this.setState(
            {
                clickedLat: event.lat,
                clickedLng: event.lng
            },
            async () => {
                if (this.state.clickedLat && this.state.clickedLng) {
                    await this.updateIac(
                        IotaAreaCodes.encode(
                            this.state.clickedLat,
                            this.state.clickedLng,
                            IotaAreaCodes.CodePrecision.NORMAL
                        ));
                }
            }
        );
    }

    /**
     * Update based on iota area code.
     * @param iac The area code.
     * @param skipChanged Skip the changed event.
     */
    private async updateIac(iac: string, skipChanged?: boolean): Promise<void> {
        if (this._mounted) {
            if (IotaAreaCodes.isValid(iac)) {
                const area = IotaAreaCodes.decode(iac);

                this.setState(
                    {
                        latitude: area.latitude,
                        longitude: area.longitude,
                        clickedLat: this.state.clickedLat || area.latitude,
                        clickedLng: this.state.clickedLng || area.longitude,
                        areaCode: iac,
                        findingLocation: false
                    },
                    async () => this.saveSettings());

                this.updateHighlight(area);

                if (this._mounted && !skipChanged) {
                    this.props.onChanged(iac);
                }
            } else {
                if (this._highlight) {
                    this._highlight.setMap(undefined);
                    this._highlight = undefined;
                }
            }
        }
    }

    /**
     * Update the highlight on the map.
     * @param area The area to highlight.
     */
    private updateHighlight(area: IotaAreaCodes.IacCodeArea): void {
        if (this._highlight) {
            this._highlight.setMap(undefined);
        }

        this._highlight = new this._maps.Rectangle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map: this._map,
            bounds: {
                south: area.latitudeLow,
                north: area.latitudeHigh,
                west: area.longitudeLow,
                east: area.longitudeHigh
            }
        });
    }

    /**
     * Get the current location.
     */
    private getLocation(): void {
        if (navigator.geolocation) {
            this.setState({ findingLocation: true, zoom: 17 }, () => {
                navigator.geolocation.getCurrentPosition(
                    async pos => {
                        await this.updateIac(
                            IotaAreaCodes.encode(
                                pos.coords.latitude,
                                pos.coords.longitude,
                                IotaAreaCodes.CodePrecision.NORMAL
                            ));
                    },
                    () => {
                        this.setState({ findingLocation: false });
                    });
            });
        }
    }

    /**
     * Save the map settings.
     */
    private async saveSettings(): Promise<void> {
        const settings = await this._settingsService.get();
        settings.longitude = this.state.longitude;
        settings.latitude = this.state.latitude;
        settings.zoom = this.state.zoom;
        await this._settingsService.save();
    }
}

export default AreaCodeMap;
