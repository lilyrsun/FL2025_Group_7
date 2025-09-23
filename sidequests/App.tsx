import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AuthForm, { useSupabaseAuth } from './components/AuthForm';
import * as AuthSession from 'expo-auth-session';


export default function App() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'sidequests' });
  console.log(redirectUri);
  useSupabaseAuth();

  return (
    <View style={styles.container}>
      {/* <Text>Hello world!</Text>
      <StatusBar style="auto" /> */}

      <AuthForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    width: "100%"
  },
});
