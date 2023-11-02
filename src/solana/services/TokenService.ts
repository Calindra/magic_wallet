import { TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { PublicKey } from '@solana/web3.js';
// import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
// import { fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
// import { PublicKey as MPublicKey } from '@metaplex-foundation/umi'

// Use the RPC endpoint of your choice.
// const umi = createUmi('https://api.devnet.solana.com').use(mplTokenMetadata())

let tokenPromise = new TokenListProvider().resolve()
let cached: any = {}

export default class TokenService {

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

    // static async fetchDigitalAsset(mint: PublicKey) {
    //     return await fetchDigitalAsset(umi, mint.toBase58() as MPublicKey)
    // }

}