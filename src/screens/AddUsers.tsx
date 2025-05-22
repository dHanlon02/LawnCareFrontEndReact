// src/screens/AddUserScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../api/apiClient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type Role = 'employee' | 'admin';
interface RouteParams { role: Role; }

const AddUserScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const role: Role = route.params?.role ?? 'employee';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');

  const [skillset, setSkillset]       = useState('');
  const [availability, setAvailability] = useState('');
  const [location, setLocation]       = useState('');

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username || !password || !email) {
      Alert.alert('Validation', 'Username, password, and email are required.');
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        username,
        password,
        email,
        phone,
        role: role.toUpperCase(),
      };
      if (role === 'employee') {
        payload.skillset = skillset;
        payload.availability = availability;
        payload.location = location;
      }
      const response = await apiClient.post('/admin/create-user', payload);
      Alert.alert('Success', response.data.toString(), [
        { text: 'OK', onPress: () => navigation.navigate('ManageUsers') }
      ]);
    } catch (err: any) {
      console.error('Create user error', err);
      const msg = err.response?.data || 'Failed to create user.';
      Alert.alert('Error', msg.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create New {role.charAt(0).toUpperCase() + role.slice(1)}</Text>
      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Username" />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone"
        keyboardType="phone-pad"
      />

      {role === 'employee' && (
        <>
          <Text style={styles.subtitle}>Employee Details</Text>
          <Text style={styles.label}>Skillset</Text>
          <TextInput
            style={styles.input}
            value={skillset}
            onChangeText={setSkillset}
            placeholder="e.g. Lawn care, trimming"
          />

          <Text style={styles.label}>Availability</Text>
          <TextInput
            style={styles.input}
            value={availability}
            onChangeText={setAvailability}
            placeholder="e.g. Weekdays 9–5"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City or region"
          />
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.saveText}>Save</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddUserScreen;

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 8, color: '#555' },
  label: { fontSize: 14, fontWeight: '500', marginTop: 12, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginTop: 4 },
  saveBtn: { backgroundColor: '#388E3C', padding: 15, borderRadius: 6, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});