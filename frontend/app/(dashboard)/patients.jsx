import { router } from "expo-router";
import { useState, useEffect } from "react";
import axios from "axios";
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
  const [data, setData] = useState(null);

  useEffect(() => {
    console.log("Querying patients!");

    axios
      .get(`http://172.20.10.4:5000/api/patients`)
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.patient}
            onPress={() =>
              router.push({
                pathname: `/patients/${item.id}`,
                params: { id: item.id, name: item.name },
              })
            }
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
