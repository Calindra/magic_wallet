import { PublicKey } from '@solana/web3.js';
import React, { useState, useEffect, useContext } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import SvgQRCode from 'react-native-qrcode-svg';
import useColorScheme from '../hooks/useColorScheme';
import { TokenImage } from '../src/components/TokenImage';
import AuthContext from '../src/contexts/AuthContext';
import AccountService from '../src/solana/services/AccountService';

const darkStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000'
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        margin: 20,
    },
    button: {
        flex: 0.1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        color: 'white',
    },
});

const whiteStyles = {
    ...darkStyles,
    container: {
        ...darkStyles.container,
        backgroundColor: '#EEEEEE'
    },
    text: {
        ...darkStyles.text,
        color: '#000000'
    }
}

export default function SolanaQRCodeScreen({ route }: any) {
    const colorScheme = useColorScheme();
    const styles = colorScheme === 'dark' ? darkStyles : whiteStyles;

    const [refreshing, setRefreshing] = useState(false)
    const [qrCodeContent, setQrCodeContent] = useState('')
    const { tokenPublicKey, accountPubKey } = route.params || {}
    const [tokenBalance, setTokenBalance] = useState('')
    const [listenerId, setListenerId] = useState(0)
    const { password } = useContext(AuthContext)

    async function loadBalance(taPubKey: PublicKey) {
        const amount = await AccountService.getTokenAccountBalance(taPubKey)
        setTokenBalance(amount.value.uiAmountString || amount.value.amount)
    }

    async function initWallet() {
        let keypair = await AccountService.loadKeypair(password)
        if (!keypair) {
            console.log('sem wallet')
            return;
        }
        let payload: any = {
            to: keypair.publicKey.toBase58()
        }
        if (tokenPublicKey) {
            payload.coin = tokenPublicKey
            const taPubKey = new PublicKey(accountPubKey)
            loadBalance(taPubKey)
            console.log({ tokenPublicKey, accountPubKey })
            const id = AccountService.listenAccount(taPubKey, () => {
                console.log('saldo alterado')
                loadBalance(taPubKey)
            })
            setListenerId(id)
        }
        setQrCodeContent(JSON.stringify(payload))
    }

    const willUnmount = () => {
        if (listenerId) {
            AccountService.remoteAccountChangeListener(listenerId)
        }
    }

    async function onRefresh() {
        setRefreshing(true)
        await initWallet()
        setRefreshing(false)
    }

    useEffect(() => {
        initWallet()
        return willUnmount
    }, [tokenPublicKey])

    return (
        <ScrollView style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
            <View
                style={{
                    width: '100%',
                    flexDirection: 'column',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    marginTop: 20
                }}>
                {qrCodeContent ? (
                    <>
                        {tokenPublicKey ? (
                            <>
                                <TokenImage tokenPublicKey={new PublicKey(tokenPublicKey)} />
                                <View style={{ paddingTop: 3}}></View>
                                <Text style={styles.text}>Saldo: {tokenBalance}</Text>
                            </>
                        ) : (
                            <Text></Text>
                        )}
                        <View style={{ padding: 10}}></View>
                        <SvgQRCode value={qrCodeContent} size={200} color={styles.text.color} backgroundColor={styles.container.backgroundColor} />
                    </>
                ) : (
                    <Text>Você precisa iniciar a carteira com uma chave privada</Text>
                )}
            </View>
        </ScrollView>
    )

}


