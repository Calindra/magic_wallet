import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { Text, View } from '../components/Themed';
import useColorScheme from '../hooks/useColorScheme';
import { TokenImage } from '../src/components/TokenImage';
import AuthContext from '../src/contexts/AuthContext';
import AccountService from '../src/solana/services/AccountService';
import TransactionService from '../src/solana/services/TransactionService';
import { StackActions } from '@react-navigation/native';
import { getMint } from '@solana/spl-token';

const darkStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 15,
        height: 1,
        width: '80%',
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        color: '#fff',
        borderColor: '#ccc',
        width: '80%'
    },
    text: {
        color: '#fff'
    },
    placeholder: {
        color: '#777777'
    }
});

const whiteStyles = {
    ...darkStyles,
    text: {
        ...darkStyles.text,
        color: '#000000'
    },
    input: {
        ...darkStyles.input,
        color: '#000000',
        borderColor: '#CCCCCC',
    }
}

const Button = ({ onPress, style, text }: any) => {
    return (
        <Pressable onPress={onPress} >
            <View style={{ borderColor: '#CCCCCC', borderRadius: 3, borderWidth: 1, padding: 7, paddingLeft: 15, paddingRight: 15 }}>
                <Text style={style}>
                    {text}
                </Text>
            </View>
        </Pressable>
    )
}

export default function SolanaTransferScreen({ route, navigation }: any) {
    const colorScheme = useColorScheme();
    const styles = colorScheme === 'dark' ? darkStyles : whiteStyles;
    const { payment } = route.params || {}
    const [pubKeyStr, setPubKeyStr] = useState(payment.to || '');
    const [accountPubKey, setAccountPubKey] = useState(payment.accountPubKey || '');
    const [memo, setMemo] = useState(payment.memo || '');
    const [coin, setCoin] = useState(payment.coin || '');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [tokenPublicKey, setTokenPublicKey] = useState(null as any)
    const [success, setSuccess] = useState(false)
    const { password } = useContext(AuthContext)

    useEffect(() => {
        if (coin) {
            setTokenPublicKey(new PublicKey(coin))
        } else {
            setTokenPublicKey(null)
        }
    }, [coin])

    async function sendAmount() {
        console.log('enviando...')
        const start = Date.now()
        setLoading(true)
        const keypair = await AccountService.loadKeypair(password)
        if (!keypair) {
            console.log('wallet nao iniciada')
            return
        }
        const destPublicKey = new PublicKey(pubKeyStr)

        if (coin) {
            const fromAccount = new PublicKey(accountPubKey)
            await TransactionService.transferToken(coin, +amount, fromAccount, destPublicKey, keypair, memo)
            console.log('enviado', amount)
        } else {
            const amountNum = +amount * LAMPORTS_PER_SOL
            await TransactionService.transfer(keypair, destPublicKey, amountNum, memo)
            console.log('enviado', amountNum)
        }
        console.log('tempo total do envio', (Date.now() - start), 'ms')
        setLoading(false)
        setSuccess(true)
    }

    if (success) {
        return (
            <View style={styles.container}>
                <View style={{marginBottom: 15}}>
                    <Text style={{...styles.text, fontSize: 24, lineHeight: 33}}>Sucesso!</Text>
                </View>
                <Button
                    onPress={() => {
                        navigation.navigate('Solana', { shouldRefresh: Date.now() })
                    }}
                    text='Ok'
                />
            </View>
        )
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.text} >Aguarde um instante</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enviando:</Text>
            <TokenImage tokenPublicKey={tokenPublicKey} />
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            <Text style={styles.title}>Para Public Key:</Text>
            <TextInput style={styles.input} onChangeText={setPubKeyStr} value={pubKeyStr} />
            <Text style={styles.title}>Valor:</Text>
            <TextInput
                style={styles.input}
                onChangeText={setAmount}
                value={amount}
                placeholder="0.01"
                placeholderTextColor={styles.placeholder.color}
                keyboardType="numeric"
            />
            <Text style={styles.title}>Mensagem:</Text>
            <TextInput style={styles.input} onChangeText={setMemo} value={memo} />
            <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
            <Button text='Enviar' onPress={() => {
                sendAmount()
            }}
            />
        </View >
    );
}


