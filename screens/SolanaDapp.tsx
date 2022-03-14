import * as React from 'react';
import { useContext } from 'react';
import { StyleSheet } from 'react-native';

import { WebView } from 'react-native-webview';
import AuthContext from '../src/contexts/AuthContext';
import AccountService from '../src/solana/services/AccountService';
import tweetnacl from 'tweetnacl';

export default function SolanaDapp() {
  const webview = React.useRef(null);
  const [pubKeyStr, setPubKeyStr] = React.useState('')
  const [privateKey, setPrivateKey] = React.useState<Uint8Array>()
  const { password } = useContext(AuthContext)

  async function initWallet() {
    let keypair = await AccountService.loadKeypair(password)
    if (!keypair) {
      keypair = await AccountService.createKeypair(password)
    }
    setPubKeyStr(keypair.publicKey.toBase58())
    setPrivateKey(keypair.secretKey)
  }

  React.useEffect(() => {
    initWallet()
  }, [])

  const handleOnMessage = (ev: any) => {
    console.log('event', ev.nativeEvent.data)
    const rawJson = JSON.parse(ev.nativeEvent.data);
    if (privateKey && rawJson.method == 'signMessage') {
      const signData = Uint8Array.from(rawJson.message)
      const signed = tweetnacl.sign.detached(signData, privateKey);
      if (!webview.current) {
        console.log('Sem referencia da webview para enviar a mensagem assinada')
        return
      }
      const commonArray: number[] = [];
      for (let i = 0; i < signed.length; i++) {
        commonArray.push(signed[i]);
      }
      (webview.current as any).postMessage(JSON.stringify({ method: rawJson.method, result: commonArray }));
    }
  }

  const runFirst = `
  // ini - facewall (remover)
  window.SolPeerDapp = {};
  window.SolPeerDapp.getPublicKey = () => {
    return Promise.resolve('${pubKeyStr}')
  };
  // fim - facewall (remover)

  (function () {
    if (window.calindraMagic) {
      console.log('calindra magic ja esta injetada');
      return;
    }
    const publicKeyStr = "${pubKeyStr}";
    if (!publicKeyStr) {
      console.log('PublicKey missing, injection aborted.');
      return;
    }
    var solana = {};
    solana.isConnected = true;
    solana.on = (evName, fn) => {
        if (evName === 'connect') {
            fn();
        }
    };
    solana.off = () => { };
    solana.publicKeyString = publicKeyStr;
    solana.isCalindraMagic = true;

    var signMessagePromisse;
    console.log('addEventListener to handle message from RN.')
    document.addEventListener("message", function (event) {
        const rawJson = JSON.parse(event.data);
        if (rawJson.method == 'signMessage') {
          const result = Uint8Array.from(rawJson.result);
          signMessagePromisse.resolve({signature: result});
        }
    });

    solana.signMessage = (message) => {
      var basicArray = [];
      for (var i = 0; i < message.length; i++) {
        basicArray.push(message[i]);
      }
      window.ReactNativeWebView.postMessage(JSON.stringify({
        method: 'signMessage',
        message: basicArray
      }));
      signMessagePromisse = {};
      signMessagePromisse.promise = new Promise((resolve, reject) => {
        signMessagePromisse.resolve = resolve;
        signMessagePromisse.reject = reject;
      })
      return signMessagePromisse.promise;
    };
    window.calindraMagic = solana;
    var WALLET_NAME_KEY = 'walletName';
    localStorage.setItem(WALLET_NAME_KEY, JSON.stringify("Magic Wallet"));
  })();
  true;
  `

  return (
    <WebView
      style={styles.container}
      originWhitelist={['*']}
      ref={webview}
      nativeConfig={{ props: { webContentsDebuggingEnabled: true } }}
      source={{
        // uri: 'https://facewall-calindra.herokuapp.com/facewall/game/'
        // uri: 'http://172.16.1.9:1234/',
        uri: 'http://192.168.1.102:1234/'
      }}
      onMessage={handleOnMessage}
      injectedJavaScript={runFirst}
      onNavigationStateChange={newNavState => {
        console.log(newNavState.url)
        const script = runFirst
        setTimeout(() => {
          console.log(`injetando script [${pubKeyStr}]`, new Date().toISOString())
          if (!webview.current) {
            console.log('Sem referencia da webview')
            return
          }
          (webview.current as any).injectJavaScript(script)
        }, 1)
      }}
    />
  );
}

const styles = StyleSheet.create({
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
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
