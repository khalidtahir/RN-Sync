import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import Patient from "../../components/Patient";
import { useUser } from "../../hooks/useUser";

const HTTP_URL = "https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com";

const Patients = () => {
  const { userId } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      console.log("Querying patients!");

      setLoading(true);
      axios
        .get(`${HTTP_URL}/patients`)
        .then((response) => {
          // Filter patients by doctor_id matching current user's ID
          const filteredData = response.data.data.filter(
            (patient) => patient.doctor_id === userId,
          );
          setData(filteredData);
          console.log(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("couldn't be done champ", error);
          setLoading(false);
        });
    }, [userId]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Patients</Text>
          <Text style={styles.subtitle}>Recent Admissions</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push("/patients/add")}
        >
          <Text style={styles.addButtonText}>+ Add Patient</Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : data ? (
        <FlatList
          data={data}
          style={styles.patients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <Patient patient={item} index={index} />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No patients found</Text>
        </View>
      )}
    </View>
  );
};
export default Patients;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 4,
  },
  addButtonPressed: {
    backgroundColor: "#0056B3",
    opacity: 0.9,
  },
  addButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  patients: {
    width: "100%",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
