import * as SecureStore from 'expo-secure-store';
import { Connection, clusterApiUrl } from "@solana/web3.js";

export default class ClusterService {

    private static connection?: Connection

    private static clusterApiUrl?: string

    private static clusterName?: 'devnet' | 'testnet' | 'mainnet-beta'

    static getConnection() {
        if (!this.connection) {
            // mudando para "confirmed", pois "finalized" leva uns 30s :-/
            this.connection = new Connection(this.getClusterApiUrl(), 'confirmed');
        }
        return this.connection
    }

    static getClusterApiUrl() {
        if (!this.clusterApiUrl) {
            this.clusterApiUrl = clusterApiUrl(this.clusterName)
        }
        return this.clusterApiUrl
    }

    static setClusterNameOrUrl(nameOrUrl: string) {
        if (/^(devnet|testnet|mainnet-beta)$/.test(nameOrUrl)) {
            // @ts-ignore
            this.clusterName = nameOrUrl
            // @ts-ignore
            this.clusterApiUrl = clusterApiUrl(nameOrUrl)
        } else {
            this.clusterApiUrl = nameOrUrl
            this.clusterName = undefined
        }
        this.connection = undefined
        SecureStore.setItemAsync('solana.clusterApiUrl', this.clusterApiUrl)
    }
}
