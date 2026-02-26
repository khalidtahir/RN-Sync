import { StyleSheet, Text, View, Dimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
// import WebSocket from "ws";

import { LineChart } from "react-native-chart-kit";
import { useUser } from "../../../hooks/useUser";

const WS_URL = "wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/";

function generateHeartRateData() {
  const heartRate = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
  return {
    type: "ECG",
    bpm: heartRate,
    timestamp: new Date().toISOString(),
  };
}

const PatientDetails = () => {
  const { id } = useLocalSearchParams();
  const { token } = useUser();

  const [data, setData] = useState([80]);
  // useEffect(() => {
  //   // 1. Set up the interval
  //   const intervalId = setInterval(() => {
  //     // Use functional state updates (prevCount) to avoid stale closures
  //     setData((prevData) => [
  //       ...prevData,
  //       Math.floor(Math.random() * (100 - 60 + 1)) + 60,
  //     ]);
  //   }, 1000); // 1000ms = 1 second

  //   // 2. Return a cleanup function
  //   return () => {
  //     clearInterval(intervalId); // Clear the interval when the component unmounts
  //   };
  // }, []);

  // webSocket connection
  useEffect(() => {
    // Don't connect if token isn't available yet
    if (!token) {
      console.log("Waiting for authentication token...");
      return;
    }

    // 1. Get Token
    console.log("Token available, length:", token.length);

    // 2. Connect with Token
    const secureUrl = `${WS_URL}?token=${token}`;
    console.log(`Connecting to WebSocket...`);

    const ws = new WebSocket(secureUrl);

    ws.onopen = () => {
      console.log("Connected! Starting data stream...");

      // Send data every 1 second
      const intervalId = setInterval(() => {
        const data = generateHeartRateData();
        // Match the format expected by websocket-handler (ingest route)
        const message = {
          action: "ingest",
          patientId: id, // Use the patient ID from the route
          metric: "heart_rate",
          value: data.bpm,
          unit: "bpm",
          timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(message));
        console.log("Sent:", message);
        setData((prevData) => [...prevData, data.bpm]);
      }, 1000);

      // Store intervalId for cleanup
      ws.intervalId = intervalId;
    };

    ws.onmessage = (event) => {
      console.log("Received from server:", event.data);
      // Server sends status messages, not data to display
      // Real data should be fetched via HTTP API
    };

    ws.onclose = () => {
      console.log("Disconnected.");
      process.exit(0);
    };

    ws.onerror = (err) => {
      console.error("Connection error:", err.message);
    };

    // Cleanup function
    return () => {
      if (ws.intervalId) {
        clearInterval(ws.intervalId);
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [token]); // Re-run when token becomes available

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Patient Details for {id}</Text>
      <LineChart
        data={{
          labels: ["4AM", "5AM", "6AM", "7AM", "8AM", "9AM"],
          datasets: [
            {
              data: data,
            },
          ],
        }}
        width={Dimensions.get("window").width} // from react-native
        height={300}
        yAxisLabel=""
        yAxisSuffix="bpm"
        yAxisInterval={1} // optional, defaults to 1
        chartConfig={{
          backgroundColor: "#e26a00",
          backgroundGradientFrom: "#fb8c00",
          backgroundGradientTo: "#ffa726",
          decimalPlaces: 0, // optional, defaults to 2dp
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
export default PatientDetails;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  welcome: {
    fontSize: 20,
  },
});
