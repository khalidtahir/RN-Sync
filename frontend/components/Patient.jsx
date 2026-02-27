import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import { router } from "expo-router";

import JaneImage from "../assets/Jane.png";
import JohnImage from "../assets/John.png";
import RobertImage from "../assets/Robert.png";
import Spacer from "./Spacer";

const images = [JohnImage, JaneImage, RobertImage];

const Patient = ({ patient, index }) => {
  const { bed, id, created_at, name } = patient;

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
      <View style={styles.left}>
        <Image source={images[index % images.length]} style={styles.headshot} />
        <Spacer width={5} height={5} />
        <Text style={styles.name}>{name}</Text>
      </View>
      <View style={styles.right}>
        <Text>{bed}</Text>
        <Spacer height={10} width={10} />
        <Text>{created_at.slice(0, 10)}</Text>
      </View>

      {/* <Text style={styles.vital}>{latest_vital}</Text> */}
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
  name: {
    fontSize: 15,
  },
  headshot: {
    height: 50,
    width: 50,
    padding: 0,
    margin: 0,
    borderRadius: "100%",
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  right: {
    textAlign: "right",
  },
});
