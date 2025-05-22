import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

interface Service {
  serviceId: number;
  name: string;
  price: number;
  duration: number;
}

const BookServiceScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();

  const [services, setServices]         = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate]                 = useState('');
  const [time, setTime]                 = useState('');
  const [address, setAddress]           = useState('');
  const [notes, setNotes]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [isFetching, setIsFetching]     = useState(true);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const svcRes = await axios.get<Service[]>(
          'http://10.0.2.2:8080/api/customer/services',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setServices(svcRes.data);

        const meRes = await axios.get<{ address?: string }>(
          'http://10.0.2.2:8080/api/customer/me',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (meRes.data.address) setAddress(meRes.data.address);
      } catch (err: any) {
        console.error(err);
        Alert.alert('Error', 'Failed to load data.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchInitial();
  }, [token]);

  const validate = () => {
    if (!selectedService) {
      Alert.alert('Missing', 'Select a service.');
      return false;
    }
    if (!date.trim()) {
      Alert.alert('Missing', 'Enter a date.');
      return false;
    }
    if (!time.trim()) {
      Alert.alert('Missing', 'Enter a time.');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Missing', 'Enter your address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      // combine date + time into one ISO string
      const scheduledDate = new Date(`${date}T${time}:00`).toISOString();  
  
      const payload = {
        serviceId:      selectedService!.serviceId,
        scheduledDate,                
        address:        address.trim(),
        notes:          notes.trim() || undefined,
      };
  
      const res = await axios.post(
        'http://10.0.2.2:8080/api/customer/book-service',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (res.status >= 200 && res.status < 300) {
        Alert.alert(
          'Booked',
          'Appointment submitted!',
          [{ text: 'OK', onPress: () => navigation.navigate('CustomerAppointments') }]
        );
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not submit booking.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Book a Service</Text>

      <Text style={styles.label}>Select Service</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {services.map(svc => {
          const sel = selectedService?.serviceId === svc.serviceId;
          return (
            <TouchableOpacity
              key={svc.serviceId}
              style={[styles.card, sel && styles.cardSelected]}
              onPress={() => setSelectedService(svc)}
            >
              <Text style={styles.cardTitle}>{svc.name}</Text>
              <Text>{`$${svc.price.toFixed(2)} · ${svc.duration} min`}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="e.g. 2025-05-10"
      />

      <Text style={styles.label}>Time (HH:mm)</Text>
      <TextInput
        style={styles.input}
        value={time}
        onChangeText={setTime}
        placeholder="e.g. 14:30"
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Your address"
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any special requests…"
        multiline
      />

      <TouchableOpacity
        style={[
          styles.submit,
          (!selectedService || !date.trim() || !time.trim() || !address.trim()) && styles.disabled,
        ]}
        onPress={handleSubmit}
        disabled={isLoading || !selectedService || !date.trim() || !time.trim() || !address.trim()}
      >
        {isLoading
          ? <ActivityIndicator color="#fff"/>
          : <Text style={styles.submitText}>Submit Appointment</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title:     { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  label:     { fontWeight: '600', marginTop: 16, marginBottom: 8 },
  card:      {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  cardSelected: { backgroundColor: '#cce5ff' },
  cardTitle:    { fontWeight: '600' },
  input:        {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
  },
  notes:        { height: 80, marginTop: 8 },
  submit:       {
    marginTop: 24,
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled:     { backgroundColor: '#999' },
  centered:     {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});



export default BookServiceScreen;
