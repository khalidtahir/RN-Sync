import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
  FlatList,
  ScrollView,
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
  const [history, setHistory] = useState([]);
  const [toggleHistory, setToggleHistory] = useState(false);

  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      console.log("Querying current patient data");

      setData([]);
      setDetectedMetrics(new Set());
      setLastReadingTime(null);
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
          readings.forEach((reading) => {
            if (reading.metric) {
              newMetrics.add(reading.metric);
            }
          });
          setDetectedMetrics(newMetrics);
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
      temperature: "°F",
      oxygen_saturation: "%",
      blood_pressure_systolic: "mmHg",
      blood_pressure_diastolic: "mmHg",
      respiratory_rate: "breaths/min",
    };

    const unit = unitMap[metric] || "";

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
          width={Dimensions.get("window").width - 50}
          height={250}
          yAxisLabel=""
          yAxisSuffix={unit ? ` ${unit}` : ""}
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: "#e26a00",
            backgroundGradientFrom: "#fb8c00",
            backgroundGradientTo: "#ffa726",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726",
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
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
        paddingLeft: insets.left + 16,
        paddingRight: insets.right + 16,
      }}
    >
      {data[0] && (
        <View style={{ flex: 1, width: "100%" }}>
          <Text style={styles.welcome}>Patient Details for {name}</Text>
          <Text>For Doctor {user}</Text>

          {/* Scrollable container for metric charts */}
          <ScrollView
            style={{ flex: 1, marginVertical: 12, marginHorizontal: 0 }}
          >
            {/* Dynamically render charts for each detected metric */}
            {Array.from(detectedMetrics).map((metric) =>
              renderMetricChart(metric),
            )}
          </ScrollView>

          <View style={{ alignItems: "center", marginVertical: 12 }}>
            <Card style={{ backgroundColor: "lightgray", width: "60%" }}>
              <Pressable
                onPress={() => getHistory(id)}
                style={{ paddingHorizontal: 12 }}
              >
                <Text style={{ textAlign: "center" }}>
                  {toggleHistory
                    ? "Hide historical data"
                    : "See historical data"}
                </Text>
              </Pressable>
            </Card>
          </View>
          {toggleHistory && history.length > 0 && (
            <FlatList
              data={computeHourlySummaries(history)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card>
                  <Text>
                    {item.hour} - {item.metric}: {item.average} {item.unit}
                  </Text>
                </Card>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};
export default PatientDetails;

const styles = StyleSheet.create({
  container: {
    height: "100%",
    alignContent: "center",
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 20,
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
});
