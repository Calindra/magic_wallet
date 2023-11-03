import { TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

import { PublicKey as MPublicKey, Umi } from '@metaplex-foundation/umi'

import { fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import ClusterService from './ClusterService';

let tokenPromise = new TokenListProvider().resolve()
let cached: any = {}

export default class TokenService {

    static umi?: Umi

    static getUmi() {
        if (!this.umi) {
            this.umi = createUmi(ClusterService.getClusterApiUrl()).use(mplTokenMetadata())
        }
        return this.umi
    }

    static async findAll() {
        if (!tokenPromise) {
            tokenPromise = new TokenListProvider().resolve()
        }
        const tokens = await tokenPromise
        const tokenList = tokens.getList()
        return tokenList
    }

    /**
     * Super cached method
     */
    static async findByPublicKey(publicKey: PublicKey): Promise<TokenInfo | null> {
        const tokenPubKey = publicKey.toBase58()
        let token = cached[tokenPubKey]
        if (typeof token !== 'undefined') {
            return token
        }
        const tokenList = await this.findAll()
        token = tokenList.find(o => o.address === tokenPubKey) || null
        cached[tokenPubKey] = token
        return token
    }

    static async fetchDigitalAsset(mint: PublicKey) {
        return await fetchDigitalAsset(this.getUmi(), mint.toBase58() as MPublicKey)
    }

}