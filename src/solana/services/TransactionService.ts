import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import AccountService from "./AccountService";
import * as web3 from '@solana/web3.js';
import { createMemoInstruction } from "../memo";

const MAX_TRANSACTION_BATCH_SIZE = 10

const PROJECT_KEY = new web3.PublicKey('7ZkLNvr3bby3gWX81Uqky5HvHSGbEZoar9Bzk2AkXyyV')
export default class TransactionService {
    /**
     * 
     * @param publicKey wallet/account public key
     * @param options 
     * @returns 
     */
    static async findAllByPublicKey(publicKey: web3.PublicKey, options?: web3.ConfirmedSignaturesForAddress2Options) {
        const connection = AccountService.getConnection()
        const signatures = await connection.getConfirmedSignaturesForAddress2(publicKey, options)
        const transactionMap = await this.fetchParsedTransactions(signatures.map(s => s.signature))
        return Array.from(transactionMap.values()) as web3.ParsedConfirmedTransaction[]
    }

    static isTokenTransfer(transaction: web3.ParsedConfirmedTransaction) {
        const res = !!(transaction.meta?.preTokenBalances?.length && transaction.meta.postTokenBalances?.length)
        return res
    }

    static async fetchParsedTransactions(transactionSignatures: string[]) {
        const transactionMap = new Map();
        const connection = AccountService.getConnection()
        let mutableSignatures = transactionSignatures.slice()
        while (mutableSignatures.length > 0) {
            const signatures = mutableSignatures.splice(
                0,
                MAX_TRANSACTION_BATCH_SIZE
            );
            const fetched = await connection.getParsedConfirmedTransactions(signatures);
            fetched.forEach((parsed: web3.ParsedConfirmedTransaction | null, index: number) => {
                if (parsed !== null) {
                    transactionMap.set(signatures[index], parsed);
                }
            });
        }

        return transactionMap;
    }

    static async transfer(fromKeypair: web3.Signer, toPubkey: web3.PublicKey, lamports: number, memo: string = '') {
        const connection = AccountService.getConnection()
        let transaction = new web3.Transaction();
        const instructions: web3.TransactionInstruction[] = [
            web3.SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey,
                lamports
            })
        ];
        instructions.push(
            web3.SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: PROJECT_KEY,
                lamports: 5000
            })
        )
        if (memo) {
            instructions.push(createMemoInstruction(memo, [fromKeypair.publicKey]))
        }
        transaction.add(...instructions);
        const signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [fromKeypair]
        );
        return await connection.getParsedConfirmedTransaction(signature)
    }
    static async transferToken(tokenMintAddress: string, amount: number, destPublicKey: web3.PublicKey, keypair: web3.Signer, memo: string = '') {
        const mintPublicKey = new web3.PublicKey(tokenMintAddress);
        const mintToken = new Token(
            AccountService.getConnection(),
            mintPublicKey,
            TOKEN_PROGRAM_ID,
            keypair // the wallet owner will pay to transfer and to create recipients associated token account if it does not yet exist.
        );
        const fromTokenAccount = await mintToken.getOrCreateAssociatedAccountInfo(keypair.publicKey);
        // Get the derived address of the destination wallet which will hold the custom token
        const associatedDestinationTokenAddr = await Token.getAssociatedTokenAddress(
            mintToken.associatedProgramId,
            mintToken.programId,
            mintPublicKey,
            destPublicKey
        );
        const receiverAccount = await AccountService.getConnection().getAccountInfo(associatedDestinationTokenAddr);
        const instructions: web3.TransactionInstruction[] = [];
        if (receiverAccount === null) {
            console.log('Criando conta do destinatario')
            instructions.push(
                Token.createAssociatedTokenAccountInstruction(
                    mintToken.associatedProgramId,
                    mintToken.programId,
                    mintPublicKey,
                    associatedDestinationTokenAddr,
                    destPublicKey,
                    keypair.publicKey
                )
            )
        }

        instructions.push(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                fromTokenAccount.address,
                associatedDestinationTokenAddr,
                keypair.publicKey,
                [],
                amount
            )
        );

        if (memo) {
            instructions.push(createMemoInstruction(memo, [keypair.publicKey]))
        }

        const transaction = new web3.Transaction().add(...instructions);
        transaction.feePayer = keypair.publicKey;
        console.log('enviando e confirmando a transacao')
        let res = await web3.sendAndConfirmTransaction(
            AccountService.getConnection(),
            transaction,
            [keypair]
        );
        console.log('confirmando.', res)
        await AccountService.getConnection().confirmTransaction(res);
        console.log('confirmado.')
    }
}
