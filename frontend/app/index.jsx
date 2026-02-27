import { Link } from "expo-router";
import { StyleSheet, Text, View, Image } from "react-native";
import logo from "../assets/RNSyncLogo.png";
const Home = () => {
  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
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
    fontSize: 30,
    marginBottom: 20,
  },
  link: {
    textDecorationLine: "underline",
  },
  logo: {
    height: 150,
    width: 150,
    marginBottom: 20,
  },
});
