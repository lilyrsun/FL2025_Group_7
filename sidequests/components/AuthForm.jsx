import React, { useState, useEffect } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { Button, Input } from '@rneui/themed'
// import GoogleOAuth from './GoogleOAuth'
import { signInWithGoogle } from './signInWithGoogle'
import * as Linking from "expo-linking";
import GoogleSignInButton from './google-sign-in-button'
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();
export function useSupabaseAuth() {
  useEffect(() => {
    const sub = Linking.addEventListener("url", async ({ url }) => {
      const { data, error } = await supabase.auth.getSessionFromUrl({ url });
      if (error) console.error("Auth error:", error);
      else console.log("User:", data.session?.user);
    });

    return () => sub.remove();
  }, []);
}

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithEmail() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    else {
      console.log("login success")
    }
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true)
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) Alert.alert(error.message)
    if (!session) Alert.alert('Please check your inbox for email verification!')
    setLoading(false)
  }


const redirectUri = AuthSession.makeRedirectUri({
  scheme: "sidequests",
  path: "auth/callback",
});
  
  // In your component or function:
  const handleSignInWithGoogle = async () => {
  try {
      const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: redirectUri,
          },
      });
      if (error) throw error;
      console.log('User signed in:', data.user);
  } catch (error) {
  console.error('Google sign-in error:', error.message);
  }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          // leftIcon={{ type: 'font-awesome', name: 'envelope' }}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          // leftIcon={{ type: 'font-awesome', name: 'lock' }}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Log in" disabled={loading} onPress={() => signInWithEmail()} />
      </View>
      <View style={styles.verticallySpaced}>
        <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title="Sign in with Google"
          disabled={loading}
          onPress={() => handleSignInWithGoogle()}
        />
        {/* <Button
          title="Sign in with Google"
          disabled={loading}
          onPress={async () => {
            const result = await signInWithGoogle();
            console.log("OAuth result:", result);
          }}
        /> */}
      </View>

      <GoogleSignInButton />

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
    width: "100%"
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})