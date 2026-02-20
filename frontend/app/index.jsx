import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
const Home = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to RNSync!</Text>
      <Link href="/login" style={styles.link}>
        Sign In
      </Link>
    </View>
  );
};
export default Home;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 20,
    marginBottom: 20,
  },
  link: {
    textDecorationLine: "underline",
  },
});
