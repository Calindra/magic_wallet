import { TokenInfo } from "@solana/spl-token-registry";
import { PublicKey } from "@solana/web3.js";

export interface ITokenAccount {
    publicKey: PublicKey
    token: PublicKey
    amount: ITokenAmount
    tokenInfo?: TokenInfo | null
}

export interface ITokenAmount {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
}
