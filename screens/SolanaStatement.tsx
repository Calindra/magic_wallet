import { LAMPORTS_PER_SOL, ParsedConfirmedTransaction, ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from "@solana/web3.js";
import dayjs from "dayjs";
import { Asset } from "expo-asset";
import React, { useContext, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ImageBackground, SafeAreaView, Button } from "react-native";
import useColorScheme from "../hooks/useColorScheme";
import { TokenImage } from "../src/components/TokenImage";
import { TokenName } from "../src/components/TokenName";
import AuthContext from "../src/contexts/AuthContext";
import { MEMO_PROGRAM_ID } from "../src/solana/memo";
import AccountService from "../src/solana/services/AccountService";
import TransactionService from "../src/solana/services/TransactionService";

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
    item: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 5,
        padding: 5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        margin: 3,
        opacity: 0.79,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    tokenBox: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 5,
        padding: 5,
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 3
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
        backgroundColor: '#EEEEEE'
    }
}

function TransactionViewWithStyles({ styles, showToken }: any) {

    function MemoText({ instructions }: { instructions: (ParsedInstruction | PartiallyDecodedInstruction)[] }) {
        const memoProgramId = MEMO_PROGRAM_ID.toBase58()
        const memoInstruction = instructions.find(inst => inst.programId.toBase58() === memoProgramId)
        if (!memoInstruction) {
            return <Text style={styles.text}>Msg: -</Text>
        } else {
            return <Text style={styles.text}>Msg: {(memoInstruction as any).parsed}</Text>
        }
    }

    function Amount({ instructions }: { instructions: (ParsedInstruction | PartiallyDecodedInstruction)[] }) {
        const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111'
        const systemInstruction = instructions.find(inst => inst.programId.toBase58() === SYSTEM_PROGRAM_ID)
        if (!systemInstruction) {
            return <Text style={styles.text}>-</Text>
        } else {
            const parsed = (systemInstruction as any).parsed
            if (parsed.type === 'transfer') {
                return <>
                    <Text style={styles.text}>De: {parsed.info.source}</Text>
                    <Text style={styles.text}>Para: {parsed.info.destination}</Text>
                    <Text style={styles.text}>Qtd: {parsed.info.lamports / LAMPORTS_PER_SOL}</Text>
                </>
            } else {
                return <Text style={styles.text}>-</Text>
            }
        }
    }

    function FromToAmount({ transaction }: { transaction: ParsedConfirmedTransaction }) {
        const diff: any = {}
        let decimals = 9
        transaction.meta?.postTokenBalances?.forEach(item => {
            decimals = item.uiTokenAmount.decimals;
            diff[(item as any).owner] = item.uiTokenAmount.uiAmount
        })
        transaction.meta?.preTokenBalances?.forEach(item => {
            const current = diff[(item as any).owner] ?? 0
            diff[(item as any).owner] = current - (item.uiTokenAmount.uiAmount || 0)
        })
        const owners = Object.getOwnPropertyNames(diff)
        const fromAccount = owners.find(owner => diff[owner] < 0)
        const toAccount = owners.find(owner => diff[owner] > 0)
        const amount = Math.abs(diff[toAccount || '']).toFixed(decimals)
        if (isNaN(+amount)) {
            return null
        }
        return (
            <>
                <Text style={styles.text}>De: {fromAccount}</Text>
                <Text style={styles.text}>Para: {toAccount}</Text>
                <Text style={styles.text}>Qtd: {amount}</Text>
            </>
        )
    }

    function TokenText({ transaction }: { transaction: ParsedConfirmedTransaction }) {
        if (!transaction.meta?.postTokenBalances) {
            return <Text style={styles.text}>?</Text>
        }
        const preTokenBalances = transaction.meta.preTokenBalances
        if (preTokenBalances && preTokenBalances?.length > 0) {
            return <Text style={styles.text}>Token: {preTokenBalances[0].mint}</Text>
        }
        return <Text style={styles.text}>??</Text>
    }

    return function TransactionView({ item: transaction }: { item: ParsedConfirmedTransaction }) {
        return (
            <View style={{ ...styles.item }}>
                <Text style={styles.text}>{dayjs(transaction.blockTime! * 1000).format('YYYY-MM-DD HH:mm')}</Text>

                {TransactionService.isTokenTransfer(transaction) ? (
                    <>
                        {showToken && (<TokenText transaction={transaction} />)}
                        <FromToAmount transaction={transaction} />
                    </>
                ) : (
                    <>
                        <Text style={styles.text}>Token: SOL</Text>
                        <Amount instructions={transaction.transaction.message.instructions} />
                    </>
                )}
                <MemoText instructions={transaction.transaction.message.instructions} />
                {transaction.meta?.fee && (
                    <Text style={styles.text}>Taxa SOL: {transaction.meta?.fee / LAMPORTS_PER_SOL}</Text>
                )}
            </View>
        )
    }
}

const image = { uri: Asset.fromModule(require("../assets/images/background.png")).uri }

export default function SolanaStatementScreen({ route, navigation }: any) {
    const colorScheme = useColorScheme();
    const styles = colorScheme === 'dark' ? darkStyles : whiteStyles;
    const [transactions, setTransactions] = useState([] as ParsedConfirmedTransaction[])
    const [refreshing, setRefreshing] = useState(true)
    const { publicKey: pPublicKey, tokenPublicKey } = route.params || {}
    const { password } = useContext(AuthContext)

    async function resolvePublicKeyAccount() {
        if (pPublicKey) {
            console.log(`publicKey[${pPublicKey}] from params`)
            return new PublicKey(pPublicKey)
        }
        let keypair = await AccountService.loadKeypair(password)
        if (keypair) {
            console.log('default publicKey')
            return keypair.publicKey
        }
        return null
    }

    async function loadTransactions() {
        setRefreshing(true)
        setTransactions([])
        const publicKey = await resolvePublicKeyAccount()
        if (!publicKey) {
            console.log('public key not resolved')
            return
        }
        console.log(`finding transactions of account[${publicKey.toBase58()}]...`)
        const transactions = await TransactionService.findAllByPublicKey(publicKey)
        console.log({ transactionsLen: transactions.length })
        setTransactions(transactions)
        setRefreshing(false)
    }

    useEffect(() => {
        loadTransactions()
    }, [pPublicKey])

    const HeaderView = () => {
        return (
            <View style={{ ...styles.container, padding: 15, marginBottom: 7 }}>
                {tokenPublicKey ? (
                    <>

                        <TokenImage tokenPublicKey={new PublicKey(tokenPublicKey)} />
                        <Text style={{ ...styles.text, fontSize: 21, lineHeight: 24 }}><TokenName tokenPublicKey={new PublicKey(tokenPublicKey)} /></Text>
                    </>
                ) : (
                    <Text style={{ ...styles.text, fontSize: 12, lineHeight: 12 }}>{tokenPublicKey}</Text>
                )}
            </View>
        )
    }

    return (
        <ImageBackground source={image} resizeMode="cover" style={styles.image}>
            <FlatList
                data={transactions}
                renderItem={TransactionViewWithStyles({ styles, showToken: !tokenPublicKey })}
                refreshing={refreshing}
                keyExtractor={t => {
                    return `x-${t.blockTime}-${t.transaction.signatures.join('-')}`
                }}
                onRefresh={() => {
                    loadTransactions()
                }}
                ListHeaderComponent={HeaderView}
            />
        </ImageBackground>
    )
}