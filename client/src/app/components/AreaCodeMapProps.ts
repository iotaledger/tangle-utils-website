export interface AreaCodeMapProps {
    /**
     * The iac to display.
     */
    iac: string;

    /**
     * The component is disabled.
     */
    disabled?: boolean;

    /**
     * The location has changed.
     */
    onChanged(iac: string): void;
}
