export interface AreaCodeMapProps {
    /**
     * The iac to display.
     */
    iac: string;

    /**
     * The location has changed.
     */
    onChanged(iac: string): void;
}
