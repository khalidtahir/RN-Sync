import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Pressable,
} from "react-native";

import { useUser } from "../../hooks/useUser";
import { router } from "expo-router";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);

  const { login } = useUser();

  // useEffect(() => {
  //   console.log(email);
  // }, [email]);

  const handleSubmit = async () => {
    console.log(email);
    console.log(password);

    try {
      const response = await login(email, password);

      setError(null);
      router.replace("/profile");
    } catch (error) {
      console.log(error.message);
      setError(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Sign In</Text>

      <TextInput
        placeholder="Email"
        style={[
          { width: "80%", marginTop: 30, marginBottom: 20 },
          styles.input,
        ]}
        keyboardType="email-address"
        onChangeText={setEmail}
        value={email}
      ></TextInput>

      <TextInput
        placeholder="Password"
        style={[{ width: "80%", marginBottom: 20 }, styles.input]}
        // keyboardType="email-address"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      ></TextInput>

      <Pressable onPress={handleSubmit} style={styles.button}>
        <Text>Login</Text>
      </Pressable>

      {error && (
        <View style={styles.error}>
          <Text style={{ width: 280 }}>{error}</Text>
        </View>
      )}
    </View>
  );
};
export default Login;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    borderColor: "black",
    borderWidth: 1,
    padding: 10,
  },
  button: {
    backgroundColor: "lightgreen",
    padding: 18,
    borderRadius: 6,
    marginVertical: 10,
  },
  error: {
    backgroundColor: "red",
    padding: 20,
    marginTop: 10,
    borderRadius: 10,
  },
});
