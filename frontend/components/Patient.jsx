import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";

import JaneImage from "../assets/Jane.png";
import JohnImage from "../assets/John.png";
import RobertImage from "../assets/Robert.png";

const images = [JohnImage, JaneImage, RobertImage];

const Patient = ({ patient, index }) => {
  const { bed, id, created_at, name } = patient;
  const [imageLoading, setImageLoading] = useState(true);

  const admissionDate = new Date(created_at);
  const formattedDate = admissionDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.patient,
        pressed && styles.patientPressed,
      ]}
      onPress={() =>
        router.push({
          pathname: `/patients/${id}`,
          params: { id: id, name: name },
        })
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {imageLoading && (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.avatarPlaceholder}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Image
              source={images[index % images.length]}
              style={[styles.headshot, !imageLoading && { opacity: 1 }]}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              fadeDuration={200}
            />
          </View>
          <View style={styles.nameSection}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.bedInfo}>Room {bed}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.dateLabel}>Admitted</Text>
          <Text style={styles.dateValue}>{formattedDate}</Text>
        </View>
      </View>
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </Pressable>
  );
};
export default Patient;
const styles = StyleSheet.create({
  patient: {
    width: "100%",
    backgroundColor: "white",
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patientPressed: {
    backgroundColor: "#f9f9f9",
    opacity: 0.95,
  },
  content: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  imageContainer: {
    position: "relative",
    width: 48,
    height: 48,
    marginRight: 12,
  },
  headshot: {
    height: 48,
    width: 48,
    borderRadius: 24,
    position: "absolute",
  },
  imagePlaceholder: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  avatarPlaceholder: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  bedInfo: {
    fontSize: 13,
    color: "#007AFF",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dateValue: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  arrow: {
    paddingLeft: 8,
  },
  arrowText: {
    fontSize: 24,
    color: "#ccc",
    fontWeight: "300",
  },
});
