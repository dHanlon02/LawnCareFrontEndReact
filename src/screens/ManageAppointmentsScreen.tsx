import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  useWindowDimensions,
  Platform,
} from 'react-native';
import apiClient from '../api/apiClient';

interface Customer {
  customerId: number;
  userId: number;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  totalAppointments: number;
}

interface Appointment {
  appointmentId: number;
  scheduledDate: string;
  serviceName: string;
  status: string;
  staffName: string;
  address: string;
  notes: string;
}

interface Service {
  serviceId: number;
  name: string;
  duration: number;
}

interface Employee {
  employeeId: number;
  name: string;
}

const ManageAppointmentsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;


  const [filters, setFilters] = useState({
    customerId: '',
    userId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [selected, setSelected] = useState<Customer | null>(null);
  const [past, setPast] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);

  const [bookingVisible, setBookingVisible] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selService, setSelService] = useState<number | null>(null);
  const [selEmployee, setSelEmployee] = useState<number | null>(null);

  const [date, setDate] = useState(new Date());
  const [dateString, setDateString] = useState(() => date.toISOString().slice(0, 10)); 
  const [timeString, setTimeString] = useState(() => date.toTimeString().slice(0, 5)); 

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookAddress, setBookAddress] = useState('');
  const [notes, setNotes] = useState('');

  const search = async () => {
    try {
      const filteredParams = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const { data } = await apiClient.get<Customer[]>('/admin/customers', { params: filteredParams });

      setCustomers(data);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch customers');
    }
  };
  const clear = () => {
    setFilters({ customerId: '', userId: '', name: '', email: '', phone: '', address: '' });
    setCustomers([]);
    setSelected(null);
  };

  useEffect(() => {
    if (!selected) return;
    (async () => {
      try {
        const [pRes, uRes] = await Promise.all([
          apiClient.get<Appointment[]>(
            `/admin/customers/${selected.customerId}/appointments`,
            { params: { past: true } }
          ),
          apiClient.get<Appointment[]>(
            `/admin/customers/${selected.customerId}/appointments`,
            { params: { past: false } }
          ),
        ]);
        setPast(pRes.data);
        setUpcoming(uRes.data);
      } catch {
        Alert.alert('Error', 'Could not load appointments');
      }
    })();
  }, [selected]);

  const cancelAppt = async (id: number) => {
    try {
      await apiClient.put(`/admin/appointments/${id}/cancel`);
      // reload
      setSelected(sel => sel && sel);
    } catch {
      Alert.alert('Error', 'Could not cancel');
    }
  };

  const openBooking = async () => {
    if (!selected) return;
    try {
      const [svcRes, empRes] = await Promise.all([
        apiClient.get<Service[]>('/admin/services'),
        apiClient.get<Employee[]>('/admin/employees'),
      ]);
      setServices(svcRes.data);
      setEmployees(empRes.data);
      setBookAddress(selected.address);
      setBookingVisible(true);
      const iso = new Date();
      setDate(iso);
      setDateString(iso.toISOString().slice(0, 10));
      setTimeString(iso.toTimeString().slice(0, 5));
    } catch {
      Alert.alert('Error', 'Could not load services or staff');
    }
  };

  const submitBooking = async () => {
    if (!selService || !selEmployee || !selected) {
      Alert.alert('Validation', 'Service, staff & date required');
      return;
    }
    try {
      await apiClient.post(`/admin/customers/${selected.customerId}/appointments`, {
        serviceId: selService,
        employeeId: selEmployee,
        scheduledDate: new Date(`${dateString}T${timeString}`).toISOString(),
        address: bookAddress,
        notes,
      });
      Alert.alert('Success', 'Appointment booked');
      setBookingVisible(false);
      setSelected(sel => sel && sel);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data || 'Booking failed');
    }
  };

  return (
    <View style={[styles.container, isNarrow && styles.stack]}>
      <View style={styles.left}>
        <Text style={styles.header}>Search Customers</Text>
        {(
          ['customerId', 'userId', 'name', 'email', 'phone', 'address'] as (keyof typeof filters)[]
        ).map(k => (
          <TextInput
            key={k}
            style={styles.input}
            placeholder={k === 'customerId' ? 'Customer ID' :
              k === 'userId' ? 'User ID' :
                k === 'phone' ? 'Phone' : k.charAt(0).toUpperCase() + k.slice(1)}
            value={String(filters[k])}
            onChangeText={v => setFilters(f => ({ ...f, [k]: v }))}
            keyboardType={k.endsWith('Id') || k === 'phone' ? 'number-pad' : undefined}
            accessibilityLabel={k}
          />
        ))}
        <View style={styles.buttonRow}>
          <Button title="Search" onPress={search} />
          <Button title="Clear" onPress={clear} color="#888" />
        </View>
        <FlatList
          data={customers}
          keyExtractor={c => c.customerId.toString()}
          style={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No results</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => setSelected(item)}
              accessibilityRole="button"
            >
              <Text style={styles.cell}>{item.customerId}</Text>
              <Text style={styles.cell}>{item.name}</Text>
              <Text style={styles.cell}>{item.email}</Text>
              <Text style={styles.cell}>{item.phoneNumber}</Text>
              <Text style={styles.cell}>{item.totalAppointments}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.right}>
        <Text style={styles.header}>Customer Detail</Text>
        {!selected ? (
          <Text style={styles.empty}>Select a customer →</Text>
        ) : (
          <>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{selected.name}</Text>
              <Text>ID: {selected.customerId} | UID: {selected.userId}</Text>
              <Text>{selected.email} | {selected.phoneNumber}</Text>
              <Text>{selected.address}</Text>
            </View>

            <Text style={styles.subheader}>Past Appointments</Text>
            <FlatList
              data={past.sort((a, b) => Date.parse(b.scheduledDate) - Date.parse(a.scheduledDate))}
              keyExtractor={a => a.appointmentId.toString()}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.cell}>{new Date(item.scheduledDate).toLocaleString()}</Text>
                  <Text style={styles.cell}>{item.serviceName}</Text>
                  <Text style={styles.cell}>{item.status}</Text>
                  <Text style={styles.cell}>{item.staffName}</Text>
                </View>
              )}
            />

            <Text style={styles.subheader}>Upcoming Appointments</Text>
            <FlatList
              data={upcoming.sort((a, b) => Date.parse(a.scheduledDate) - Date.parse(b.scheduledDate))}
              keyExtractor={a => a.appointmentId.toString()}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.cell}>{new Date(item.scheduledDate).toLocaleString()}</Text>
                  <Text style={styles.cell}>{item.serviceName}</Text>
                  <Text style={styles.cell}>{item.status}</Text>
                  <Text style={styles.cell}>{item.staffName}</Text>
                  <Button title="Cancel" onPress={() => cancelAppt(item.appointmentId)} />
                  <Button title="Reschedule" onPress={openBooking} />
                </View>
              )}
            />
            <Button title="Book New Appointment" onPress={openBooking} />
          </>
        )}
      </View>

      <Modal visible={bookingVisible} animationType="slide">
        <View style={styles.modal}>
          <Text style={styles.header}>Book New Appointment</Text>
          <Text>Service:</Text>
          <FlatList
            data={services}
            horizontal
            keyExtractor={s => s.serviceId.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selService === item.serviceId && styles.modalOptionSel,
                ]}
                onPress={() => setSelService(item.serviceId)}
              >
                <Text>{item.name} ({item.duration}m)</Text>
              </TouchableOpacity>
            )}
          />
          <Text>Staff:</Text>
          <FlatList
            data={employees}
            horizontal
            keyExtractor={e => e.employeeId.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selEmployee === item.employeeId && styles.modalOptionSel,
                ]}
                onPress={() => setSelEmployee(item.employeeId)}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <Text>Date (YYYY-MM-DD):</Text>
          <TextInput
            style={styles.input}
            value={dateString}
            onChangeText={(text) => setDateString(text)}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />

          <Text>Time (HH:mm):</Text>
          <TextInput
            style={styles.input}
            value={timeString}
            onChangeText={(text) => setTimeString(text)}
            placeholder="HH:mm"
            keyboardType="numbers-and-punctuation"
          />


          <Text>Address:</Text>
          <TextInput
            style={styles.input}
            value={bookAddress}
            onChangeText={setBookAddress}
          />
          <Text>Notes:</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
          />
          <View style={styles.buttonRow}>
            <Button title="Confirm" onPress={submitBooking} />
            <Button title="Cancel" onPress={() => setBookingVisible(false)} color="#888" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  stack: {
    flexDirection: 'column',
  },
  left: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  right: {
    flex: 2,
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    backgroundColor: '#424242',
    padding: 8,
    borderRadius: 4,
    color: '#fff',
  },
  subheader: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    color: '#388E3C',
    backgroundColor: '#e8f5e9',
    padding: 4,
    borderRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#388E3C',
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  list: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
    color: '#424242',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
  detailHeader: {
    marginBottom: 8,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#424242',
  },
  detailInfo: {
    fontSize: 14,
    color: '#555',
  },
  modal: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  modalOption: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#388E3C',
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  modalOptionSel: {
    backgroundColor: '#388E3C',
  },
});

export default ManageAppointmentsScreen;

