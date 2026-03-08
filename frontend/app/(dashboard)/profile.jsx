import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useUser } from "../../hooks/useUser";
import { useRouter } from "expo-router";

const Profile = () => {
  const { user, logout } = useUser();
  const router = useRouter();

  const handleSignout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Sign Out",
        onPress: () => {
          logout();
          router.replace("/(auth)/login");
        },
        style: "destructive",
      },
    ]);
  };

  // Fake user data
  const profileData = {
    name: "Dr. Sarah Johnson",
    role: "Medical Doctor",
    email: user || "doctor@medical.com",
    phone: "+1 (555) 123-4567",
    specialization: "General Medicine",
    license: "MD-45678901",
    joinDate: "January 2023",
    bio: "Experienced healthcare professional dedicated to patient care and wellness.",
    location: "New York, NY",
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Avatar */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>SJ</Text>
        </View>
        <Text style={styles.name}>{profileData.name}</Text>
        <Text style={styles.role}>{profileData.role}</Text>
        <Text style={styles.bio}>{profileData.bio}</Text>
      </View>

      {/* Contact Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{profileData.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{profileData.phone}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{profileData.location}</Text>
        </View>
      </View>

      {/* Professional Information Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Professional Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Specialization</Text>
          <Text style={styles.value}>{profileData.specialization}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>License Number</Text>
          <Text style={styles.value}>{profileData.license}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>{profileData.joinDate}</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <Pressable
        style={({ pressed }) => [
          styles.signoutButton,
          pressed && styles.signoutButtonPressed,
        ]}
        onPress={handleSignout}
      >
        <Text style={styles.signoutButtonText}>Sign Out</Text>
      </Pressable>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingBottom: 20,
  },
  headerSection: {
    backgroundColor: "#ffffff",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "white",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: "#007AFF",
    marginBottom: 12,
    fontWeight: "600",
  },
  bio: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  infoRow: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
  signoutButton: {
    backgroundColor: "#FF3B30",
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  signoutButtonPressed: {
    backgroundColor: "#CC2E26",
    opacity: 0.9,
  },
  signoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpacing: {
    height: 20,
  },
});
