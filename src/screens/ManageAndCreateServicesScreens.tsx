// src/screens/ManageAndCreateServicesScreens.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SectionList, ActivityIndicator, Animated,
  Dimensions, RefreshControl, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/apiClient';

/* ───────────── model coming from the API ───────────── */
interface Service {
  serviceId: number;
  name: string;
  description?: string;
  price: number;          // received as number (spring‑boot ≥3 serialises BigDecimal → number)
  duration: number;       // minutes
}

/*────────────────────── MANAGE ──────────────────────*/
export const ManageServicesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const slide = useRef(new Animated.Value(-Dimensions.get('window').width)).current;

  const [services, setServices]   = useState<Service[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [refresh,  setRefresh]    = useState(false);

  const fetchAll = async () => {
    try {
      if (!refresh) setLoading(true);
      // Removed extra '/api'
      const { data } = await apiClient.get<Service[]>('/admin/services');
      setServices(data);
    } catch (e) {
      console.error('load services', e);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => {
    Animated.timing(slide, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    fetchAll();
  }, []);

  const remove = async (serviceId: number) => {
    try {
      // Removed extra '/api'
      await apiClient.delete(`/admin/services/${serviceId}`);
      setServices(s => s.filter(x => x.serviceId !== serviceId));
    } catch (e: any) {
      Alert.alert('Error', e.response?.data ?? 'Delete failed');
    }
  };

  if (loading) return <Center><ActivityIndicator size="large" /></Center>;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slide }] }]}>
      {/* header bar */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>Services</Text>
        <TouchableOpacity style={styles.createBtn}
          onPress={() => navigation.navigate('AddServiceScreen')}>
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={[{ title: 'all', data: services }]}
        keyExtractor={item => item.serviceId.toString()}
        renderSectionHeader={() => null}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text style={styles.serviceSub}>
                {item.duration} min • £{Number(item.price).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity style={styles.dangerBtn} onPress={() => remove(item.serviceId)}>
              <Text style={styles.dangerBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); fetchAll(); }} />
        }
        ListEmptyComponent={<Center><Text>No services yet.</Text></Center>}
      />
    </Animated.View>
  );
};

/*────────────────────── ADD ──────────────────────*/
export const AddServiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [name, setName]         = useState('');
  const [desc, setDesc]         = useState('');
  const [price, setPrice]       = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving]     = useState(false);

  const save = async () => {
    if (!name || !price || !duration) {
      Alert.alert('Validation', 'Name, price & duration are required');
      return;
    }
    try {
      setSaving(true);
      // Removed extra '/api'
      await apiClient.post('/admin/services', {
        name,
        description: desc,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
      });
      Alert.alert('Created', 'Service saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data ?? 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Service</Text>

      <Label text="Name"      /><Input val={name}      onSet={setName}/>
      <Label text="Description"/><Input val={desc}      onSet={setDesc} multiline/>
      <Label text="Price (£)" /><Input val={price}     onSet={setPrice}    keyboard="decimal-pad"/>
      <Label text="Duration (min)"/><Input val={duration} onSet={setDuration} keyboard="number-pad"/>

      <TouchableOpacity style={styles.primaryBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

/*────────────────── helpers & styles ──────────────────*/
const Center: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  <View style={styles.center}>{children}</View>;

const Label: React.FC<{ text: string }> = ({ text }) =>
  <Text style={styles.label}>{text}</Text>;

const Input = ({
  val, onSet, keyboard, multiline = false,
}: { val: string; onSet: (t: string) => void; keyboard?: any; multiline?: boolean }) => (
  <TextInput
    style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
    value={val}
    onChangeText={onSet}
    keyboardType={keyboard}
    multiline={multiline}
  />
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeaderContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#388E3C', padding: 8, paddingHorizontal: 16,
  },
  sectionHeader: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  createBtn: { backgroundColor: '#fff', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4 },
  createBtnText: { color: '#388E3C', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  label: { fontSize: 14, fontWeight: '500', marginTop: 12, color: '#444' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginTop: 4 },
  primaryBtn: { backgroundColor: '#388E3C', padding: 15, borderRadius: 6, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16 },
  serviceName: { fontSize: 16, fontWeight: '600' },
  serviceSub: { fontSize: 14, color: '#555' },
  separator: { height: 1, backgroundColor: '#eee', marginHorizontal: 16 },
  dangerBtn: { backgroundColor: '#F44336', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4 },
  dangerBtnText: { color: '#fff', fontWeight: '600' },
});

