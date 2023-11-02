import { PublicKey } from "@solana/web3.js"
import TokenService from "../../../src/solana/services/TokenService"
import { PublicKey as MPublicKey } from '@metaplex-foundation/umi'


describe('TokenService', () => {

    it('should load all tokens', async () => {
        const tokens = await TokenService.findAll()
        expect(tokens.length).toBeGreaterThan(1)
    })

    it('should find a token', async () => {
        const mint = new PublicKey('CasshNb6PacBzSwbd5gw8uqoQEjcWxaQ9u9byFApShwT')
        const token = await TokenService.findByPublicKey(mint)
        expect(token).toBeDefined()

        const token2 = await TokenService.findByPublicKey(mint)
        expect(token2).toBeDefined()
    })

    it('should not find a token', async () => {
        const mint = new PublicKey('7ZkLNvr3bby3gWX81Uqky5HvHSGbEZoar9Bzk2AkXyyV')
        const token = await TokenService.findByPublicKey(mint)
        expect(token).toBeNull()

        const token2 = await TokenService.findByPublicKey(mint)
        expect(token2).toBeNull()
    })

    it('should find the asset', async () => {
        const mint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
        const res = await TokenService.fetchDigitalAsset(mint).catch(e => e)
        console.log(res.metadata?.name)
        const token = await TokenService.findByPublicKey(mint)
        console.log(token)
    })
})