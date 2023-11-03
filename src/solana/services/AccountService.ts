import * as web3 from '@solana/web3.js';
import * as SecureStore from 'expo-secure-store';
import * as nacl from 'tweetnacl';
import { ITokenAccount } from '../models/ITokenAccount';
import TokenService from './TokenService';
import prand from 'pure-rand';
import ClusterService from './ClusterService';

const { base58_to_binary, binary_to_base58 } = require('base58-js')

nacl.setPRNG((x, n) => {
    let rng1 = prand.xoroshiro128plus(42)
    for (let i = 0; i < n; i++) {
        const [firstDiceValue, rng2] = prand.uniformIntDistribution(0, 7, rng1); // value in {1..6}, here: 2
        rng1 = rng2
        x[i] = firstDiceValue
    }
    console.log(x)
})


const SPL_PUBLIC_KEY = new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
export default class AccountService {
    static remoteAccountChangeListener(accountListenerId: number) {
        ClusterService.getConnection().removeAccountChangeListener(accountListenerId)
    }

    static async getTokenAccountsByOwner(publicKey: web3.PublicKey): Promise<ITokenAccount[]> {
        const rawTokenAccountResult = await ClusterService.getConnection().getParsedTokenAccountsByOwner(publicKey, {
            programId: SPL_PUBLIC_KEY
        })

        const accounts = rawTokenAccountResult.value.filter(ta => !ta.account.data.parsed.info.isNative).map(ta => {
            const tokenAccount: ITokenAccount = {
                publicKey: ta.pubkey,
                token: new web3.PublicKey(ta.account.data.parsed.info.mint),
                amount: ta.account.data.parsed.info.tokenAmount,
            }
            return tokenAccount
        })
        for (const account of accounts) {
            account.tokenInfo = await TokenService.findByPublicKey(account.token)
        }
        return accounts
    }

    static getConnection() {
        return ClusterService.getConnection()
    }

    static getTokenAccountBalance(publicKey: web3.PublicKey) {
        return ClusterService.getConnection().getTokenAccountBalance(publicKey)
    }

    static listenAccount(publicKey: web3.PublicKey, callback: any) {
        const id = ClusterService.getConnection().onAccountChange(publicKey, (accountInfo, context) => {
            callback()
        })
        return id
    }

    static async loadKeypair(password: string = '') {
        let pubKey = await SecureStore.getItemAsync(`publicKey${password.trim()}`)
        let secKey = await SecureStore.getItemAsync(`secretKey${password.trim()}`)
        if (!pubKey || ! secKey) {
            return null
        }
        const publicKey = new web3.PublicKey(pubKey)
        try {
            const secretKey = this.fromBase58(secKey)
            return { publicKey, secretKey }
        } catch (e) {
            const secretKey = new Uint8Array(64)
            const secJson = JSON.parse(secKey)
            for (let i = 0; i < 64; i++) {
                secretKey[i] = secJson[`${i}`]
            }
            await SecureStore.setItemAsync(`secretKey${password.trim()}`, this.toBase58(secretKey))
            return { publicKey, secretKey }
        }
    }

    static fromBase58(base58encoded: string): Uint8Array {
        return base58_to_binary(base58encoded)
    }

    static toBase58(uint8Array: Uint8Array): string {
        return binary_to_base58(uint8Array)
    }

    static async createKeypair(password: string = '') {
        const keypair = web3.Keypair.generate()
        const pubKey = keypair.publicKey.toString()
        await SecureStore.setItemAsync(`publicKey${password.trim()}`, pubKey);
        await SecureStore.setItemAsync(`secretKey${password.trim()}`, this.toBase58(keypair.secretKey))
        return keypair
    }

    static async getBalance(publicKey: web3.PublicKey) {
        // meio zuado pq vc pode ver o saldo de qq pessoa...
        // console.log(`getBalance ${publicKey.toBase58()}...`)
        const balance = await ClusterService.getConnection().getBalance(publicKey)
        // console.log('balance', balance)
        return balance
    }

    static async airdrop(publicKey: web3.PublicKey) {
        console.log(`requesting airdrop to [${publicKey.toBase58()}]...`)
        let airdropSignature = await AccountService.getConnection().requestAirdrop(
            publicKey,
            web3.LAMPORTS_PER_SOL,
        );
        console.log('waiting for confirmation...')
        await AccountService.getConnection().confirmTransaction(airdropSignature);
        console.log('airdrop confirmed.')
    }
}