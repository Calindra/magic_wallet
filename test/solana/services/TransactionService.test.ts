import TransactionService from "../../../src/solana/services/TransactionService"
import * as web3 from '@solana/web3.js';
import dayjs from "dayjs";
import AccountService from "../../../src/solana/services/AccountService";

describe('TransactionService', () => {
    it('should load transactions', async () => {
        const payer = web3.Keypair.generate()
        const receiver = web3.Keypair.generate()
        await AccountService.airdrop(payer.publicKey)
        const transaction = await TransactionService.transfer(payer, receiver.publicKey, 100000, 'just another test')
        console.log(JSON.stringify({ transaction }, null, 4))
        const transactions = await TransactionService.findAllByPublicKey(payer.publicKey, { limit: 5 })
        console.log(JSON.stringify(transactions, null, 4))
        console.log(dayjs(transactions[0].blockTime! * 1000).format('YYYY-MM-DD HH:mm:ss'))
        expect(transactions[0].blockTime).toBeDefined()
    }, 60000)
})