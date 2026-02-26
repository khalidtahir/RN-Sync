import { router } from "expo-router";
import { StyleSheet, Text, View, FlatList, Pressable } from "react-native";

const patients = [
  {
    id: 1,
    name: "Mark",
  },
  {
    id: 2,
    name: "Hugh",
  },
];

const Patients = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Patients</Text>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.patient}
            onPress={() => router.push(`/patients/${item.name}`)}
          >
            <Text style={styles.name}>{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};
export default Patients;
const styles = StyleSheet.create({
  container: {
    paddingTop: 180,
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 20,
  },
  patient: {
    padding: 20,
    margin: 20,
    backgroundColor: "lightgrey",
    width: 160,
  },
  name: {
    alignSelf: "center",
  },
});
