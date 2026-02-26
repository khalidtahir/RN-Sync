import { StyleSheet, Text, View } from "react-native";
import { useUser } from "../../hooks/useUser";
const Profile = () => {
  const { user } = useUser();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user}</Text>
    </View>
  );
};
export default Profile;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 20,
  },
});
