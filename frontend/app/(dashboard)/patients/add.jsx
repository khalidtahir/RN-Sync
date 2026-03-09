import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../../hooks/useUser";

const HTTP_URL = "https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com";
const TESTDOCTOR_ID = "61d782ad-40a0-4ae9-9f30-4d84efbab7a1";

const AddPatients = () => {
  const { user, userId } = useUser();
  const [availablePatients, setAvailablePatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [error, setError] = useState(null);

  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      const fetchAvailablePatients = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await axios.get(`${HTTP_URL}/patients`);

          // Filter to show only patients NOT assigned to current user and without "Test" in name
          const available = response.data.data.filter(
            (patient) =>
              patient.doctor_id !== userId && !patient.name?.includes("Test"),
          );

          setAvailablePatients(available);
        } catch (err) {
          console.error("Error fetching patients: ", err);
          setError("Failed to load available patients");
        } finally {
          setLoading(false);
        }
      };

      fetchAvailablePatients();
    }, [userId]),
  );

  const getAssignmentStatus = (patient) => {
    if (patient.doctor_id === TESTDOCTOR_ID) {
      return "Assigned to Testdoctor0";
    } else if (!patient.doctor_id) {
      return "Unassigned";
    } else {
      return "Assigned to another doctor";
    }
  };

  const handleAssignPatient = async (patientId) => {
    try {
      setAssigningId(patientId);

      const response = await axios.put(`${HTTP_URL}/patients/${patientId}`, {
        doctor_email: user,
      });

      // Success - show alert and navigate back
      Alert.alert("Success", "Patient assigned successfully", [
        {
          text: "OK",
          onPress: () => {
            router.push("/patients");
          },
        },
      ]);
    } catch (err) {
      console.error("Error assigning patient: ", err);
      Alert.alert("Error", "Failed to assign patient. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setAssigningId(null);
    }
  };

  const renderPatientItem = ({ item }) => {
    const isAssigning = assigningId === item.id;

    return (
      <View style={styles.patientCard}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {item.name || "Unknown Patient"}
          </Text>
          <Text style={styles.assignmentStatus}>
            {getAssignmentStatus(item)}
          </Text>
          {item.id && <Text style={styles.patientId}>ID: {item.id}</Text>}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.assignButton,
            isAssigning && styles.assignButtonDisabled,
            pressed && !isAssigning && styles.assignButtonPressed,
          ]}
          onPress={() => handleAssignPatient(item.id)}
          disabled={isAssigning}
        >
          {isAssigning ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.assignButtonText}>Assign</Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View
      style={{
        ...styles.container,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/patients")}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <View>
          <Text style={styles.pageTitle}>Add Patient</Text>
          <Text style={styles.subtitle}>Available Patients</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
            onPress={() => {
              setLoading(true);
              setError(null);
              const fetchAvailablePatients = async () => {
                try {
                  const response = await axios.get(`${HTTP_URL}/patients`);
                  const available = response.data.data.filter(
                    (patient) =>
                      patient.doctor_id !== userId &&
                      !patient.name?.includes("Test"),
                  );
                  setAvailablePatients(available);
                  setLoading(false);
                } catch (err) {
                  setError("Failed to load available patients");
                  setLoading(false);
                }
              };
              fetchAvailablePatients();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : availablePatients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No available patients</Text>
          <Text style={styles.emptySubtext}>
            All patients are already assigned to you or other doctors.
          </Text>
        </View>
      ) : (
        <FlatList
          data={availablePatients}
          keyExtractor={(item) => item.id}
          renderItem={renderPatientItem}
          contentContainerStyle={styles.patientsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default AddPatients;

const styles = StyleSheet.create({
  container: {
    height: "100%",
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  patientsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  patientCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  patientInfo: {
    flex: 1,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  assignmentStatus: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  patientId: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  assignButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  assignButtonPressed: {
    backgroundColor: "#0056B3",
    opacity: 0.9,
  },
  assignButtonDisabled: {
    backgroundColor: "#CCC",
    opacity: 0.6,
  },
  assignButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonPressed: {
    backgroundColor: "#0056B3",
  },
  retryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
});
