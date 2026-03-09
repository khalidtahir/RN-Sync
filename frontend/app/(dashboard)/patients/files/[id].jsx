import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Linking,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HTTP_URL = "https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com";

const PatientFiles = () => {
  const { id, name } = useLocalSearchParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${HTTP_URL}/patients/${id}/files`);

        // Ensure data is an array
        const fileData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data
            ? [response.data.data]
            : [];

        setFiles(fileData);
      } catch (err) {
        console.error("Error fetching patient files: ", err);
        setError("Failed to load patient files. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [id]);

  const handleOpenFile = async (fileUrl) => {
    try {
      // Check if the URL is valid
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        console.error("Cannot open URL: " + fileUrl);
        alert("Unable to open this file. Try downloading it instead.");
      }
    } catch (error) {
      console.error("Error opening file: ", error);
      alert("Error opening file: " + error.message);
    }
  };

  const getFileNameFromUrl = (url) => {
    try {
      // Extract filename from S3 URL
      const urlParts = url.split("/");
      const lastPart = urlParts[urlParts.length - 1];
      // Remove query parameters if present
      const filename = lastPart.split("?")[0];
      return decodeURIComponent(filename) || "Document";
    } catch {
      return "Document";
    }
  };

  const renderFileItem = ({ item }) => {
    const fileUrl = item.storage_url;
    const fileName = getFileNameFromUrl(fileUrl);
    const isPDF = fileName.toLowerCase().endsWith(".pdf");

    return (
      <View style={styles.fileCard}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileIcon}>📄</Text>
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={2}>
              {fileName}
            </Text>
            <Text style={styles.fileType}>
              {isPDF ? "PDF Document" : "File"}
            </Text>
          </View>
        </View>
        <View style={styles.fileActions}>
          <Pressable
            style={({ pressed }) => [
              styles.viewButton,
              pressed && styles.viewButtonPressed,
            ]}
            onPress={() => handleOpenFile(fileUrl)}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.downloadButton,
              pressed && styles.downloadButtonPressed,
            ]}
            onPress={() => handleOpenFile(fileUrl)}
          >
            <Text style={styles.downloadButtonText}>Open</Text>
          </Pressable>
        </View>
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
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/patients/[id]",
              params: { id, name },
            })
          }
        >
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <View>
          <Text style={styles.pageTitle}>Patient Files</Text>
          <Text style={styles.patientName}>{name}</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading files...</Text>
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
              // Retry logic
              const fetchFiles = async () => {
                try {
                  const response = await axios.get(
                    `${HTTP_URL}/patients/${id}/files`,
                  );
                  const fileData = Array.isArray(response.data.data)
                    ? response.data.data
                    : response.data.data
                      ? [response.data.data]
                      : [];
                  setFiles(fileData);
                  setLoading(false);
                } catch (err) {
                  setError("Failed to load files. Please try again.");
                  setLoading(false);
                }
              };
              fetchFiles();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyText}>No files found</Text>
          <Text style={styles.emptySubtext}>
            This patient doesn't have any files yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.filesCount}>
            {files.length} file{files.length !== 1 ? "s" : ""} found
          </Text>
          <FlatList
            data={files}
            keyExtractor={(item, index) =>
              item.id || item.storage_url || `file-${index}`
            }
            renderItem={renderFileItem}
            scrollEnabled={false}
          />
        </ScrollView>
      )}
    </View>
  );
};

export default PatientFiles;

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
  patientName: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  filesCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 12,
    marginTop: 4,
  },
  fileCard: {
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
  fileInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  fileType: {
    fontSize: 12,
    color: "#999",
  },
  fileActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  viewButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  viewButtonPressed: {
    backgroundColor: "#0056B3",
    opacity: 0.9,
  },
  viewButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  downloadButton: {
    backgroundColor: "#E8E8E8",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  downloadButtonPressed: {
    backgroundColor: "#D0D0D0",
    opacity: 0.9,
  },
  downloadButtonText: {
    color: "#333",
    fontSize: 13,
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
