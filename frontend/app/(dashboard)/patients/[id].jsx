import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Pressable,
  FlatList,
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
    const metricData = data
      .filter((datum) => datum.metric === metric)
      .slice(-10)
      .map((datum) => datum.value);

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
            labels: ["4AM", "5AM", "6AM", "7AM", "8AM", "9AM"],
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
            decimalPlaces: 1,
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
      }}
    >
      {data[0] && (
        <View>
          <Text style={styles.welcome}>Patient Details for {name}</Text>
          <Text>For Doctor {user}</Text>

          {/* Dynamically render charts for each detected metric */}
          {Array.from(detectedMetrics).map((metric) =>
            renderMetricChart(metric),
          )}

          <Card style={{ backgroundColor: "lightgray" }}>
            <Pressable onPress={() => getHistory(id)}>
              <Text>See historical data</Text>
            </Pressable>
          </Card>
          <Spacer height={20}></Spacer>
          {toggleHistory && (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card>
                  <Text>
                    {item.created_at.slice(0, 19)} {item.unit.toUpperCase()}{" "}
                    {item.value}
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
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
});
