import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LineChart } from "react-native-chart-kit";
import { useUser } from "../../../hooks/useUser";
import Card from "../../../components/Card";
import Spacer from "../../../components/Spacer";

const HTTP_URL = "https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com";

const PatientDetails = () => {
  const { id, name } = useLocalSearchParams();
  const { user, token } = useUser();

  const [data, setData] = useState([]);
  const [detectedMetrics, setDetectedMetrics] = useState(new Set());
  const [lastReadingTime, setLastReadingTime] = useState(null);
  const [lastMetricUpdate, setLastMetricUpdate] = useState({});
  const [staleMetrics, setStaleMetrics] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [toggleHistory, setToggleHistory] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      console.log("Querying current patient data");

      setData([]);
      setDetectedMetrics(new Set());
      setLastReadingTime(null);
      setLastMetricUpdate({});
      setStaleMetrics(new Set());
      setToggleHistory(false);

      // Initial fetch of patient data
      axios
        .get(`${HTTP_URL}/patients/${id}`)
        .then((response) => {
          const readings = response.data.data.latest_readings;
          setData(readings);
          // Set last reading time to the timestamp of the most recent reading
          if (readings.length > 0) {
            setLastReadingTime(readings[readings.length - 1].created_at);
          }
          // Detect metrics from initial readings
          const newMetrics = new Set();
          const metricUpdates = {};
          const now = Date.now();
          readings.forEach((reading) => {
            if (reading.metric) {
              newMetrics.add(reading.metric);
              metricUpdates[reading.metric] = now;
            }
          });
          setDetectedMetrics(newMetrics);
          setLastMetricUpdate(metricUpdates);
          setStaleMetrics(new Set());
          console.log(response.data);
        })
        .catch((error) =>
          console.error("Error fetching patient data: ", error),
        );

      // Set up interval to fetch latest patient data every second
      const intervalID = setInterval(() => {
        console.log("Querying current patient data");

        axios
          .get(`${HTTP_URL}/patients/${id}`)
          .then((response) => {
            const readings = response.data.data.latest_readings;
            // Filter to only new readings since last fetch
            const newReadings = readings.filter((reading) => {
              if (!lastReadingTime) return false; // Skip if we haven't initialized
              return new Date(reading.created_at) > new Date(lastReadingTime);
            });
            if (newReadings.length > 0) {
              setData((prevData) => [...prevData, ...newReadings]);
              // Update last reading time to the most recent new reading
              setLastReadingTime(
                newReadings[newReadings.length - 1].created_at,
              );
              // Update metric timestamps and detect new metrics
              const now = Date.now();
              setLastMetricUpdate((prevUpdates) => {
                const updatedMetrics = { ...prevUpdates };
                newReadings.forEach((reading) => {
                  if (reading && reading.metric) {
                    updatedMetrics[reading.metric] = now;
                  }
                });
                return updatedMetrics;
              });
              // Detect new metrics
              setDetectedMetrics((prevMetrics) => {
                const newMetrics = new Set(prevMetrics);
                newReadings.forEach((reading) => {
                  if (reading && reading.metric) {
                    newMetrics.add(reading.metric);
                  }
                });
                return newMetrics;
              });
              // Clear stale metrics when new data arrives
              setStaleMetrics(new Set());
            }
            console.log(readings);
          })
          .catch((error) =>
            console.error("Error fetching patient data: ", error),
          );
      }, 1000);

      return () => {
        clearInterval(intervalID);
      };
    }, [id]),
  );

  // Check for stale metrics every 500ms
  useEffect(() => {
    const staleCheckInterval = setInterval(() => {
      setStaleMetrics((prevStale) => {
        const now = Date.now();
        const newStale = new Set();

        detectedMetrics.forEach((metric) => {
          const lastUpdate = lastMetricUpdate[metric];
          if (lastUpdate && now - lastUpdate > 3000) {
            newStale.add(metric);
          }
        });

        return newStale;
      });
    }, 500);

    return () => clearInterval(staleCheckInterval);
  }, [detectedMetrics, lastMetricUpdate]);

  const computeHourlySummaries = (historyData) => {
    // Group data by hour and metric
    const hourlyData = {};

    historyData.forEach((item) => {
      const date = new Date(item.created_at);
      const hour = date.toISOString().slice(0, 13) + ":00"; // Format: YYYY-MM-DDTHH:00
      const key = `${hour}|${item.metric}`;

      if (!hourlyData[key]) {
        hourlyData[key] = {
          hour,
          metric: item.metric,
          values: [],
          unit: item.unit,
        };
      }
      hourlyData[key].values.push(parseFloat(item.value));
    });

    // Calculate averages and format for display
    return Object.values(hourlyData)
      .map((item) => {
        const avg = item.values.reduce((a, b) => a + b, 0) / item.values.length;
        return {
          id: `${item.hour}|${item.metric}`,
          hour: new Date(item.hour).toLocaleString([], {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          metric: item.metric
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          average: Math.round(avg * 100) / 100,
          unit: item.unit,
        };
      })
      .sort((a, b) => new Date(b.hour) - new Date(a.hour)); // Sort by most recent
  };

  const getHistory = (id) => {
    console.log("Querying patient's history");

    if (toggleHistory == false) {
      axios
        .get(`${HTTP_URL}/patients/${id}/history`)
        .then((response) => {
          setHistory(response.data.data);
          setToggleHistory((toggleHistory) => !toggleHistory);
          // console.log(response.data);
        })
        .catch((error) =>
          console.error("Error fetching patient history: ", error),
        );
    } else {
      setToggleHistory(false);
    }
  };

  const handleUnassignPatient = async () => {
    Alert.alert(
      "Unassign Patient",
      `Are you sure you want to unassign ${name} from your account?`,
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Unassign",
          onPress: async () => {
            try {
              setUnassigning(true);
              await axios.put(`${HTTP_URL}/patients/${id}`, {
                doctor_email: "",
              });
              setUnassigning(false);
              Alert.alert("Success", "Patient unassigned successfully", [
                {
                  text: "OK",
                  onPress: () => {
                    router.push("/patients");
                  },
                },
              ]);
            } catch (error) {
              console.error("Error unassigning patient: ", error);
              setUnassigning(false);
              Alert.alert(
                "Error",
                "Failed to unassign patient. Please try again.",
                [{ text: "OK" }],
              );
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const getYAxisConfig = (metric) => {
    // Define y-axis bounds and intervals for different metrics
    const configMap = {
      heart_rate: { min: 60, max: 100, interval: 5 },
      temperature: { min: 36, max: 39, interval: 0.5 },
      oxygen_saturation: { min: 90, max: 100, interval: 2 },
      blood_pressure_systolic: { min: 80, max: 160, interval: 10 },
      blood_pressure_diastolic: { min: 50, max: 100, interval: 10 },
      respiratory_rate: { min: 12, max: 25, interval: 2 },
    };
    return configMap[metric] || { min: 0, max: 100, interval: 10 };
  };

  const renderMetricChart = (metric) => {
    const metricReadings = data
      .filter((datum) => datum.metric === metric)
      .slice(-10);

    const metricData = metricReadings.map((datum) => datum.value).reverse();

    // Extract and format timestamps for labels (show first and last)
    const metricLabels = metricReadings
      .map((datum, index) => {
        // Only show label for the first and last data points
        if (index !== 0 && index !== metricReadings.length - 1) {
          return "";
        }
        const date = new Date(datum.created_at);
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      })
      .reverse();

    // Format metric name for display
    const displayName = metric
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Determine unit based on metric type
    const unitMap = {
      heart_rate: "bpm",
      temperature: "°C",
      oxygen_saturation: "%",
      blood_pressure_systolic: "mmHg",
      blood_pressure_diastolic: "mmHg",
      respiratory_rate: "breaths/min",
    };

    const unit = unitMap[metric] || "";

    // Get y-axis configuration for this metric
    const yAxisConfig = getYAxisConfig(metric);

    // Add invisible min/max values to force the scale
    const chartData = [...metricData];
    if (metricData.length > 0) {
      chartData.push(yAxisConfig.min);
      chartData.push(yAxisConfig.max);
    }

    return (
      <View key={metric}>
        <Text style={styles.metricTitle}>{displayName}</Text>
        <LineChart
          data={{
            labels: metricLabels.length > 0 ? metricLabels : ["No data"],
            datasets: [
              {
                data: metricData.length > 0 ? metricData : [0],
              },
            ],
          }}
          width={Dimensions.get("window").width - 32}
          height={250}
          yAxisLabel=""
          yAxisSuffix={unit ? ` ${unit}` : ""}
          yAxisInterval={yAxisConfig.interval}
          chartConfig={{
            backgroundColor: "white",
            backgroundGradientFrom: "#f8f9fa",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: metric === "temperature" ? 1 : 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
            style: {
              borderRadius: 12,
            },
            propsForDots: {
              r: "5",
              strokeWidth: "2",
              stroke: "#007AFF",
            },
          }}
          bezier
          style={{
            marginVertical: 12,
            borderRadius: 12,
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        />
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
      {data[0] && (
        <View style={{ flex: 1, width: "100%" }}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.push("/patients")}>
              <Text style={styles.backButton}>← Back</Text>
            </Pressable>
            <View>
              <Text style={styles.patientName}>{name}</Text>
              <Text style={styles.doctorInfo}>Dr. {user}</Text>
            </View>
          </View>

          {/* Scrollable container for metric charts */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Stale Data Warning */}
            {staleMetrics.size > 0 && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>No New Data</Text>
                  <Text style={styles.warningText}>
                    {Array.from(staleMetrics)
                      .map((metric) =>
                        metric
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1),
                          )
                          .join(" "),
                      )
                      .join(", ")}{" "}
                    not updated for 3+ seconds
                  </Text>
                </View>
              </View>
            )}

            {/* Dynamically render charts for each detected metric */}
            {Array.from(detectedMetrics).map((metric) =>
              renderMetricChart(metric),
            )}

            {/* History Button */}
            <View style={styles.historyButtonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.historyButton,
                  pressed && styles.historyButtonPressed,
                ]}
                onPress={() => getHistory(id)}
              >
                <Text style={styles.historyButtonText}>
                  {toggleHistory
                    ? "Hide Historical Data"
                    : "View Historical Data"}
                </Text>
              </Pressable>
            </View>

            {/* View Files Button */}
            <View style={styles.historyButtonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.historyButton,
                  pressed && styles.historyButtonPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/patients/files/[id]",
                    params: { id, name },
                  })
                }
              >
                <Text style={styles.historyButtonText}>View Patient Files</Text>
              </Pressable>
            </View>

            {/* Unassign Patient Button */}
            <View style={styles.historyButtonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.unassignButton,
                  pressed && styles.unassignButtonPressed,
                  unassigning && styles.unassignButtonDisabled,
                ]}
                onPress={handleUnassignPatient}
                disabled={unassigning}
              >
                {unassigning ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.unassignButtonText}>
                    Unassign Patient
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Historical Data */}
            {toggleHistory && history.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Historical Summary</Text>
                <FlatList
                  data={computeHourlySummaries(history)}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <View style={styles.historyCard}>
                      <View>
                        <Text style={styles.historyMetricName}>
                          {item.metric}
                        </Text>
                        <Text style={styles.historyTime}>{item.hour}</Text>
                      </View>
                      <View style={styles.historyValue}>
                        <Text style={styles.historyAverage}>
                          {item.average} {item.unit}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
export default PatientDetails;

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
  patientName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  doctorInfo: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  metricTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  historyButtonContainer: {
    marginVertical: 28,
    alignItems: "center",
  },
  historyButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  historyButtonPressed: {
    backgroundColor: "#0056B3",
    opacity: 0.9,
  },
  historyButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  historySection: {
    marginTop: 12,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  historyMetricName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  historyTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  historyValue: {
    alignItems: "flex-end",
  },
  historyAverage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  unassignButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  unassignButtonPressed: {
    backgroundColor: "#CC2D23",
    opacity: 0.9,
  },
  unassignButtonDisabled: {
    backgroundColor: "#CCC",
    opacity: 0.6,
  },
  unassignButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "#FFF3CD",
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
    lineHeight: 18,
  },
});
