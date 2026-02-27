import { StyleSheet, View } from "react-native";
import { Colors } from "../constants/Colors";

const Card = ({ style, ...props }) => {
  return (
    <View
      style={[{ backgroundColor: Colors.background }, style, styles.card]}
      {...props}
    />
  );
};
export default Card;

const styles = StyleSheet.create({
  card: {
    borderRadius: 5,
    padding: 20,
  },
});
