import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import { router } from "expo-router";

import JaneImage from "../assets/Jane.png";
import JohnImage from "../assets/John.png";
import RobertImage from "../assets/Robert.png";

const images = [JaneImage, JohnImage, RobertImage];

const Patient = ({ patient, index }) => {
  const { bed, id, last_metric, latest_vital, name } = patient;

  console.log(index);

  return (
    <Pressable
      style={styles.patient}
      onPress={() =>
        router.push({
          pathname: `/patients/${id}`,
          params: { id: id, name: name },
        })
      }
    >
      <Image source={images[index]} style={styles.headshot} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.vital}>{latest_vital}</Text>
    </Pressable>
  );
};
export default Patient;
const styles = StyleSheet.create({
  patient: {
    width: "90%",
    height: 30,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "lightgray",
    marginBottom: 5,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: "5%",
  },
  name: {},
  headshot: {
    height: 50,
    width: 50,
    padding: 0,
    margin: 0,
    borderRadius: "100%",
  },
});
