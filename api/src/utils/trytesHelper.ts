import { TRYTE_ALPHABET } from "@iota/converter";
import * as crypto from "crypto";

/**
 * Helper functions for use with trytes.
 */
export class TrytesHelper {
    /**
     * Generate a random hash.
     * @param length The length of the hash.
     * @returns The hash.
     */
    public static generateHash(length: number = 81): string {
        let hash = "";

        const randomValues = new Uint32Array(crypto.randomBytes(length));

        for (let i = 0; i < length; i++) {
            hash += TRYTE_ALPHABET.charAt(randomValues[i] % 27);
        }

        return hash;
    }
}
