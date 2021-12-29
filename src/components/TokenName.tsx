import React, { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import TokenService from "../solana/services/TokenService";

export function TokenName({ tokenPublicKey }: { tokenPublicKey: PublicKey }) {

    const [coinInfo, setCoinInfo] = useState(null as any)

    async function loadData() {
        try {
            if (!tokenPublicKey) return;
            const coinInfo = await TokenService.findByPublicKey(tokenPublicKey)
            setCoinInfo(coinInfo)
        } catch (e: any) {
            console.log(e.message)
        }
    }

    useEffect(() => {
        loadData()
    }, [tokenPublicKey])
    
    if (coinInfo) {
        return <>{coinInfo.symbol}</>
    } else if (tokenPublicKey) {
        return <>{tokenPublicKey.toBase58().substring(0, 6)}</>
    } else {
        return <>...</>
    }
}
