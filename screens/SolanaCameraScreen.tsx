import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';

export default function App({ navigation, route }: any) {
    const [hasPermission, setHasPermission] = useState(null as any);
    const [type, _setType] = useState(CameraType.back);
    const { tokenPublicKey, accountPubKey } = route.params || {}
    const isFocused = useIsFocused();

    const onCodeScanned = ({ data }: any) => {
        try {
            let payment = JSON.parse(data)
            if (!payment.to) {
                throw new Error('Falta a chave publica')
            }
            if (tokenPublicKey) {
                payment.coin = tokenPublicKey
            }
            payment.accountPubKey = accountPubKey
            navigation.navigate(...['StackTransfer', { payment }] as any)
        } catch (e) {
            console.log('error', e)
        }
    }

    const goToTransferScreen = () => {
        let payment: any = {}
        if (tokenPublicKey) {
            payment.coin = tokenPublicKey
        }
        navigation.navigate(...['StackTransfer', { payment }] as any)
    }

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    if (hasPermission === null || !isFocused) {
        return <View />
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }
    return (
        <View style={styles.container}>
            <Camera style={styles.camera}
                barCodeScannerSettings={{
                    barCodeTypes: ['qr'],
                }}
                onBarCodeScanned={(scanningResult) => {
                    onCodeScanned(scanningResult)
                }}
                type={type}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            goToTransferScreen()
                        }}>
                        <Text style={styles.text}>Digitar destino</Text>
                    </TouchableOpacity>
                </View>
            </Camera>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 5,
        borderRadius: 5
    },
    text: {
        fontSize: 18,
        color: 'white',
    },
});
