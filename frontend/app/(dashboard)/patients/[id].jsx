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

const WS_URL = "wss://dn118dyd65.execute-api.us-east-2.amazonaws.com/dev/";
const HTTP_URL = "https://vuoog0y6uf.execute-api.us-east-2.amazonaws.com";

function generateHeartRateData() {
  const heartRate = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
  return {
    bpm: heartRate,
    timestamp: new Date().toISOString(),
  };
}

function generateTemperatureData() {
  const heartRate = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
  return {
    temp: heartRate,
    timestamp: new Date().toISOString(),
  };
}

const PatientDetails = () => {
  const { id, name } = useLocalSearchParams();
  const { user, token } = useUser();

  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState(["heart_rate"]);
  const [history, setHistory] = useState([]);
  const [toggleHistory, setToggleHistory] = useState(false);

  const insets = useSafeAreaInsets();

  // webSocket connection
  useFocusEffect(
    useCallback(() => {
      // 1. Get Token
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
          let data = generateHeartRateData();
          // Match the format expected by websocket-handler (ingest route)
          let message = {
            action: "ingest",
            patientId: id, // Use the patient ID from the route
            metric: "heart_rate",
            value: data.bpm,
            unit: "bpm",
            timestamp: new Date().toISOString(),
          };

          ws.send(JSON.stringify(message));
          console.log("Sent:", message);

          // data = generateTemperatureData();
          // // Match the format expected by websocket-handler (ingest route)
          // message = {
          //   action: "ingest",
          //   patientId: id, // Use the patient ID from the route
          //   metric: "temperature",
          //   value: data.temp,
          //   unit: "degrees",
          //   timestamp: new Date().toISOString(),
          // };

          // ws.send(JSON.stringify(message));
          // console.log("Sent:", message);
        }, 1000);

        // Store intervalId for cleanup
        ws.intervalId = intervalId;
      };

      ws.onclose = () => {
        console.log("Disconnected.");
      };

      // ws.onerror = (err) => {
      //   console.error("Connection error:", err.message);
      // };

      // Clean up the WebSocket connection when the component unmounts
      return () => {
        if (ws.intervalId) {
          clearInterval(ws.intervalId);
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }, [token, id]),
  );

  useFocusEffect(
    useCallback(() => {
      console.log("Querying current patient data");

      setData([]);
      setToggleHistory(false);

      axios
        .get(`${HTTP_URL}/patients/${id}`)
        .then((response) => {
          setData(response.data.data.latest_readings);
          console.log(response.data);
        })
        .catch((error) => console.error("couldn't be done champ", error));

      const intervalID = setInterval(() => {
        console.log("Querying!!!");

        axios
          .get(`${HTTP_URL}/patients/${id}`)
          .then((response) => {
            const readings = response.data.data.latest_readings;
            setData((prevData) => [...prevData, readings[0]]);
            console.log(readings);
          })
          .catch((error) => console.error("couldn't be done champ", error));
      }, 1000);

      return () => {
        clearInterval(intervalID);
      };
    }, [id]),
  );

  const getHistory = (id) => {
    console.log("Querying patients history!");

    if (toggleHistory == false) {
      axios
        .get(`${HTTP_URL}/patients/${id}/history`)
        .then((response) => {
          setHistory(response.data.data);
          setToggleHistory((toggleHistory) => !toggleHistory);
          // console.log(response.data);
        })
        .catch((error) => console.error("couldn't be done champ", error));
    } else {
      setToggleHistory(false);
    }
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

          <Text>Heart Rate</Text>
          <LineChart
            data={{
              labels: ["4AM", "5AM", "6AM", "7AM", "8AM", "9AM"],
              datasets: [
                {
                  data: data
                    .filter((datum) => datum.metric == "heart_rate")
                    .slice(-10)
                    .map((data) => data.value),
                },
              ],
            }}
            width={Dimensions.get("window").width - 50} // from react-native
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

          {/* <Text>Temperature (F)</Text>
          <LineChart
            data={{
              labels: ["4AM", "5AM", "6AM", "7AM", "8AM", "9AM"],
              datasets: [
                {
                  data: data
                    .filter((datum) => datum.metric == "temperature")
                    .slice(-10)
                    .map((data) => data.value),
                },
              ],
            }}
            width={Dimensions.get("window").width - 50} // from react-native
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
          /> */}

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
});
