import { TokenListProvider, TokenInfo } from '@solana/spl-token-registry';
import { PublicKey } from '@solana/web3.js';


let tokenPromise = new TokenListProvider().resolve()
let cached: any = {}

export default class TokenService {

    static async findAll() {
        if (!tokenPromise) {
            tokenPromise = new TokenListProvider().resolve()
        }
        const tokens = await tokenPromise
        const tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
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

}