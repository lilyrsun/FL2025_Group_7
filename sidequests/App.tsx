import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import AuthForm from './components/AuthForm';

export default function App() {
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
