import * as web3 from '@solana/web3.js';
import AccountService from "../../../src/solana/services/AccountService"
import * as SecureStore from 'expo-secure-store';

const projectPublicKey = new web3.PublicKey('7ZkLNvr3bby3gWX81Uqky5HvHSGbEZoar9Bzk2AkXyyV')

describe('AccountService', () => {
    
    it('should not load keypair', async () => {
        jest.spyOn(SecureStore, 'getItemAsync').mockImplementation(async (_key, _options) => {
            return null
        })
        const keypair = await AccountService.loadKeypair()
        expect(keypair?.publicKey).not.toBeDefined()
    })

    it('should create keypair and store it', async () => {
        const spy = jest.spyOn(SecureStore, 'setItemAsync')
        const keypair = await AccountService.createKeypair()
        
        expect(keypair.publicKey).toBeDefined()
        expect(spy).toBeCalled()
    })

    it('should create and load keypair', async () => {
        const storage: any = {}
        jest.spyOn(SecureStore, 'getItemAsync').mockImplementation(async (key, _options) => {
            return storage[key]
        })
        jest.spyOn(SecureStore, 'setItemAsync').mockImplementation(async (key, value) => {
            storage[key] = value
        })
        await AccountService.createKeypair()
        const keypair = await AccountService.loadKeypair()
        expect(keypair?.publicKey).toBeDefined()
        expect(keypair?.secretKey).toBeDefined()
    })

    it('should get balance', async () => {
        const balance = await AccountService.getBalance(projectPublicKey)
        expect(balance).toBeGreaterThan(0)
    })

    it.only('should get tokens', async () => {
        const tokenAccounts = await AccountService.getTokenAccountsByOwner(projectPublicKey)
        expect(tokenAccounts.length).toBeGreaterThan(0)
        for (let accountInfo of tokenAccounts) {
            expect(accountInfo.amount).toBeDefined()
            expect(accountInfo.publicKey).toBeDefined()
            expect(accountInfo.token).toBeDefined()
        }
    }, 10000)

    it('should decode base58 to array', () => {
        let res = AccountService.fromBase58('Cass')
        expect(res[0]).toBe(34)
        expect(res[1]).toBe(124)
        expect(res[2]).toBe(226)
    })
})