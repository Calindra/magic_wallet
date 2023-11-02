import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, View, Text, Button, Pressable, ImageBackground, FlatList } from "react-native";
import * as web3 from '@solana/web3.js';
import { RootTabScreenProps } from "../types";

import { SafeAreaView } from 'react-native-safe-area-context';
import AccountService from "../src/solana/services/AccountService";
import { ITokenAccount } from "../src/solana/models/ITokenAccount";
import { FontAwesome } from '@expo/vector-icons';
import useColorScheme from "../hooks/useColorScheme";
import { TokenImage } from "../src/components/TokenImage";
import { TokenName } from "../src/components/TokenName";
import AuthContext from "../src/contexts/AuthContext";
import { Asset } from "expo-asset";

let publicKey: web3.PublicKey
let secretKey: Uint8Array
let accountListenerId: number

const darkStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        marginTop: 179
    },
    text: {
        fontSize: 16,
        color: '#ffffff'
    },
    tokenBox: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 5,
        padding: 5,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 3,
        opacity: 0.79,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    tokenBoxText: {
        fontSize: 16,
        color: '#ffffff',
    },
    link: {
        marginTop: 10,
        backgroundColor: "#a6d6c6",
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 5
    },
    image: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: '#000000'
    },
});

const whiteStyles = {
    ...darkStyles,
    text: {
        ...darkStyles.text,
        color: '#000000'
    },
    container: {
        ...darkStyles.container,
        backgroundColor: 'rgba(255,255, 255, 1)',
    },
    tokenBox: {
        ...darkStyles.tokenBox,
        backgroundColor: '#FFFFFF',
    },
    tokenBoxText: {
        ...darkStyles.tokenBoxText,
        color: '#000000',
    },
}

const image = { uri: Asset.fromModule(require("../assets/images/background.png")).uri }

export default function SolanaWallet({ navigation, route }: RootTabScreenProps<'Solana'>) {
    const colorScheme = useColorScheme();
    const styles = colorScheme === 'dark' ? darkStyles : whiteStyles;
    const [balance, setBalance] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const [pubKeyString, setPubKeyString] = useState('')
    const [showPrivateKey, setShowPrivateKey] = useState(false)
    const [secKeyString, setSecKeyString] = useState('')
    const [tokenAccounts, setTokenAccounts] = useState([] as ITokenAccount[])
    const { shouldRefresh } = route.params || { shouldRefresh: 0 }

    const { password } = useContext(AuthContext)

    async function airdrop() {
        console.log(`requesting airdrop to [${publicKey.toBase58()}]...`)
        let airdropSignature = await AccountService.getConnection().requestAirdrop(
            publicKey,
            web3.LAMPORTS_PER_SOL,
        );
        console.log('aguardando confirmacao.')
        await AccountService.getConnection().confirmTransaction(airdropSignature);
        console.log('confirmado?')
    }

    function onRefresh() {
        initWallet()
    }

    async function initWallet() {
        setRefreshing(true)
        try {
            let keypair = await AccountService.loadKeypair(password)
            if (!keypair) {
                keypair = await AccountService.createKeypair(password)
            }
            publicKey = keypair.publicKey
            secretKey = keypair.secretKey
            setPubKeyString(publicKey.toString())
            setSecKeyString(AccountService.toBase58(secretKey))
            getBalance()
            accountListenerId = AccountService.listenAccount(publicKey, () => {
                getBalance()
            })
            const tokenAccounts = await AccountService.getTokenAccountsByOwner(publicKey)

            const fakeTokens: ITokenAccount[] = []
            for (let i = 0; i < 0; i++) {
                const tokenKeypair = web3.Keypair.generate()
                fakeTokens.push({
                    amount: {
                        amount: '1',
                        decimals: 9,
                        uiAmount: 1,
                        uiAmountString: '1'
                    },
                    publicKey: tokenKeypair.publicKey,
                    token: tokenKeypair.publicKey
                })
            }

            setTokenAccounts(tokenAccounts.concat(fakeTokens))
        } catch (e) {
            console.log('init wallet error', e)
        } finally {
            setRefreshing(false)
        }
    }

    async function getBalance() {
        const b = await AccountService.getBalance(publicKey)
        setBalance(b)
    }

    useEffect(() => {
        initWallet()
        return () => {
            if (accountListenerId) {
                AccountService.remoteAccountChangeListener(accountListenerId)
            }
        }
    }, [shouldRefresh])

    const TokenAccountView = ({ item: tokenAccount }: any) => {
        return (
            <View style={styles.tokenBox}>
                <TokenImage tokenPublicKey={tokenAccount.token} />
                <Pressable style={{ flex: 1 }}
                    onPress={() => {
                        navigation.navigate(...['Extrato',
                            {
                                tokenPublicKey: tokenAccount.token.toBase58(),
                                publicKey: tokenAccount.publicKey.toBase58(),
                            }
                        ] as any)
                    }}
                >
                    <View style={{ paddingHorizontal: 5 }}>
                        <Text style={styles.tokenBoxText}>
                            <TokenName tokenPublicKey={tokenAccount.token} /> = {tokenAccount.amount.uiAmountString}
                        </Text>
                    </View>
                </Pressable>
                <Pressable
                    onPress={() => {
                        navigation.navigate(...['QRCode', {
                            tokenPublicKey: tokenAccount.token.toBase58(),
                            accountPubKey: tokenAccount.publicKey.toBase58(),
                        }] as any)
                    }}
                >
                    <View style={{ paddingHorizontal: 5 }}>
                        <Text style={styles.tokenBoxText}>
                            Receber
                        </Text>
                    </View>
                </Pressable>
                <Pressable
                    style={{ paddingRight: 7 }}
                    onPress={() => {
                        navigation.navigate(...['QRCodeReader', {
                            tokenPublicKey: tokenAccount.token.toBase58(),
                            accountPubKey: tokenAccount.publicKey.toBase58(),
                        }] as any)
                    }}
                >
                    <View style={{ paddingHorizontal: 5, flexDirection: "row" }}>
                        <Text style={styles.tokenBoxText}>
                            Enviar
                        </Text>
                        <TabBarIcon name="send-o" color={styles.tokenBoxText.color} />
                    </View>
                </Pressable>
            </View>
        )
    }

    const HeaderView = () => {
        return (
            <View style={{ ...styles.container, padding: 15, marginBottom: 7 }}>
                <Text style={{ ...styles.text, fontSize: 30, lineHeight: 30 }}>Wallet&nbsp;</Text>
                <Text style={{ ...styles.text, fontSize: 21, lineHeight: 24 }}>SOL Address:</Text>
                <Text style={{ ...styles.text, fontSize: 12 }} selectable={true}>{pubKeyString}</Text>
                <Button
                    title="Show private key"
                    onPress={() => {
                        console.log({ secKeyString })
                        setShowPrivateKey(!showPrivateKey)
                    }} />
                {showPrivateKey && (
                    <Text style={{ ...styles.text, fontSize: 12 }} selectable={true}>{secKeyString}</Text>
                )}
                <Text style={styles.text}>Balance: {balance / 1000000000}</Text>
                <Button title="Airdrop" onPress={airdrop} />
            </View>
        )
    }

    return (
        <ImageBackground source={image} resizeMode="cover" style={styles.image}>
            <SafeAreaView style={{ flex: 1 }}>
                <FlatList
                    data={tokenAccounts}
                    renderItem={TokenAccountView}
                    keyExtractor={tokenAccount => `x${tokenAccount.token?.toBase58()}`}
                    refreshing={refreshing} onRefresh={onRefresh}
                    ListHeaderComponent={HeaderView}
                // stickyHeaderIndices={[0]}
                />
            </SafeAreaView>
        </ImageBackground>
    )
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
}) {
    return <FontAwesome size={20} style={{ marginBottom: -3, marginLeft: 7 }} {...props} />;
}

