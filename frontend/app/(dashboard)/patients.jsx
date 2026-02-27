import { useState, useEffect } from "react";
import axios from "axios";
import { StyleSheet, Text, View, FlatList, Pressable } from "react-native";
import Patient from "../../components/Patient";

const HTTP_URL = "https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com";

const Patients = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    console.log("Querying patients!");

    axios
      .get(`${HTTP_URL}/patients`)
      .then((response) => {
        setData(response.data.data);
        console.log(response.data);
      })
      .catch((error) => console.error("couldn't be done champ", error));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Patients</Text>
      <FlatList
        data={data}
        style={styles.patients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <Patient patient={item} index={index} />
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
    width: "100%",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 20,
    marginBottom: 30,
  },
  list: {
    alignItems: "center",
  },
  patients: {
    width: "100%",
    flex: 1,
  },
});
