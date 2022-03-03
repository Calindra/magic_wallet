import { PublicKey } from "@solana/web3.js";
import React, { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import TokenService from "../solana/services/TokenService";


export function TokenImage({ tokenPublicKey }: { tokenPublicKey: PublicKey }) {

    const [coinInfo, setCoinInfo] = useState(null as any)

    async function loadData(status: any) {
        try {
            if (!tokenPublicKey) return;
            const coinInfo = await TokenService.findByPublicKey(tokenPublicKey)
            if (!status.canceled) {
                setCoinInfo(coinInfo)
            }
        } catch (e: any) {
            console.log(e.message)
        }
    }

    useEffect(() => {
        let status = { canceled: false }
        loadData(status)
        return () => {
            status.canceled = true
        }
    }, [tokenPublicKey])

    return (
        <>
            {coinInfo ? (
                <Image
                    style={{ width: 50, height: 50 }}
                    source={{
                        uri: coinInfo.logoURI,
                    }}
                />
            ) : (
                <View
                    style={{
                        width: 50,
                        height: 50,
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#FAB100',
                        borderRadius: 25
                    }}
                >
                    <Text style={{ position: "absolute", top: -1, color: '#FFD700', fontSize: 36 }}>$</Text>
                    <Text style={{ color: 'black', textAlign: 'center', fontWeight: 'bold' }}>
                        {tokenPublicKey?.toBase58()?.substring(0, 3)?.toUpperCase()}
                    </Text>
                </View>
            )}
        </>)
}