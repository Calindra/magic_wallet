import * as React from 'react';
import { useContext } from 'react';
import { StyleSheet } from 'react-native';

import { WebView } from 'react-native-webview';
import AuthContext from '../src/contexts/AuthContext';
import AccountService from '../src/solana/services/AccountService';


export default function SolanaDapp() {
  const webview = React.useRef(null);
  const [pubKeyStr, setPubKeyStr] = React.useState('')
  const { password } = useContext(AuthContext)

  async function initWallet() {
    let keypair = await AccountService.loadKeypair(password)
    if (!keypair) {
      keypair = await AccountService.createKeypair(password)
    }
    setPubKeyStr(keypair.publicKey.toBase58())
  }

  React.useEffect(() => {
    initWallet()
  }, [])

  return (
    <WebView
      style={styles.container}
      originWhitelist={['*']}
      ref={webview}
      source={{ uri: 'https://facewall-calindra.herokuapp.com/facewall/game/' }}
      onNavigationStateChange={newNavState => {
        console.log(newNavState.url)
        const script = `
        window.SolPeerDapp = {}
        window.SolPeerDapp.getPublicKey = () => {
          return Promise.resolve('${pubKeyStr}')
        }
        true;
        `
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
