import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  StatusBar,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

interface Appointment {
  appointmentId: number;
  customerName: string;
  serviceName: string;
  scheduledDate: string; // ISO‑8601
  status: 'PENDING' | 'CONFIRMED' | 'ON ROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  address: string;
}

interface Employee {
  employeeId: number;
  name: string;
}

interface ScheduledAppointment extends Appointment {
  employeeId: number;
}

interface WeekSchedule {
  monday:    ScheduledAppointment[];
  tuesday:   ScheduledAppointment[];
  wednesday: ScheduledAppointment[];
  thursday:  ScheduledAppointment[];
  friday:    ScheduledAppointment[];
  saturday:  ScheduledAppointment[];
  sunday:    ScheduledAppointment[];
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric',
});

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', {
  hour: '2-digit', minute: '2-digit', hour12: false,
});

const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);
const weekDays  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dayKeyMap: Record<string, keyof WeekSchedule> = {
  mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday',
};

const AdminAssignmentScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { user }  = useAuth();

  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);
  const [pending,  setPending]  = useState<Appointment[]>([]);
  const [emps,     setEmps]     = useState<Employee[]>([]);
  const [selAppt,  setSelAppt]  = useState<Appointment | null>(null);
  const [selEmp,   setSelEmp]   = useState<Employee | null>(null);
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [modal,    setModal]    = useState(false);
  const [assigning,setAssign]   = useState(false);

  useEffect(() => {
    if (user?.role?.toUpperCase() !== 'ADMIN') {
      Alert.alert('Access Denied', 'You do not have permission to access this screen.');
      navigation.goBack();
    }
  }, [user, navigation]);

  const load = async () => {
    try {
      setLoading(true);
      const [aRes, eRes] = await Promise.all([
        apiClient.get('/admin/appointments?status=PENDING'),
        apiClient.get('/admin/employees'),
      ]);
      setPending(aRes.data);
      setEmps(eRes.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch data.');
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefresh(true); load(); };

  const fetchSchedule = async (id: number) => {
    try {
      const res = await apiClient.get(`/admin/employees/${id}/schedule/week`);
      setSchedule(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch employee schedule.');
    }
  };
  const selectEmployee = (emp: Employee) => {
    setSelEmp(emp);
    fetchSchedule(emp.employeeId);
    setModal(true);
  };

  const assign = async () => {
    if (!selAppt || !selEmp) {
      Alert.alert('Error', 'Select an appointment and an employee first.');
      return;
    }
    try {
      setAssign(true);
      await apiClient.post(`/admin/appointments/${selAppt.appointmentId}/assign/${selEmp.employeeId}`);
      setPending(prev => prev.filter(a => a.appointmentId !== selAppt.appointmentId));
      fetchSchedule(selEmp.employeeId);
      setSelAppt(null);
      Alert.alert('Success', 'Appointment assigned!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to assign appointment.');
    } finally {
      setAssign(false);
    }
  };


  const getAppointmentsForTimeSlot = useMemo(() => {
    return (slot: string, shortDay: string) => {
      if (!schedule) return [];
      const key = dayKeyMap[shortDay.toLowerCase()];
      if (!key) return [];
      const list = schedule[key];
      if (!list) return [];
      return list.filter(a => formatTime(a.scheduledDate).startsWith(slot.split(':')[0]));
    };
  }, [schedule]);

  const renderAppt = ({ item }: { item: Appointment }) => (
    <TouchableOpacity style={[styles.appointmentRow, selAppt?.appointmentId === item.appointmentId && styles.selectedRow]}
      onPress={() => setSelAppt(item)}>
      <Text style={styles.appointmentCell}>{item.customerName}</Text>
      <Text style={styles.appointmentCell}>{item.serviceName}</Text>
      <Text style={styles.appointmentCell}>{formatDate(item.scheduledDate)}</Text>
      <Text style={styles.appointmentCell}>{formatTime(item.scheduledDate)}</Text>
    </TouchableOpacity>
  );

  const renderEmp = ({ item }: { item: Employee }) => (
    <TouchableOpacity style={styles.employeeItem} onPress={() => selectEmployee(item)}>
      <Text style={styles.employeeName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const wide = width >= 600;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.screenTitle}>Appointment Assignment</Text>

      {wide ? (
        <View style={styles.wideContainer}>
          <View style={styles.widePendingContainer}>
            <Text style={styles.sectionTitle}>Pending Appointments</Text>
            <View style={styles.tableHeader}>
              {['Customer Name', 'Service', 'Date', 'Time'].map(h => (
                <Text key={h} style={styles.headerCell}>{h}</Text>
              ))}
            </View>
            <FlatList data={pending} renderItem={renderAppt} keyExtractor={i => `${i.appointmentId}`}
              refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />} />
          </View>
          <View style={styles.wideEmployeesContainer}>
            <Text style={styles.sectionTitle}>Employees</Text>
            <FlatList data={emps} renderItem={renderEmp} keyExtractor={i => `${i.employeeId}`} />
          </View>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />}>

          <Text style={styles.sectionTitle}>Pending Appointments</Text>
          <View style={styles.tableHeader}>
            {['Customer Name', 'Service', 'Date', 'Time'].map(h => (
              <Text key={h} style={styles.headerCell}>{h}</Text>
            ))}
          </View>
          <FlatList data={pending} renderItem={renderAppt} keyExtractor={i => `${i.appointmentId}`} scrollEnabled={false} />

          <Text style={[styles.sectionTitle, styles.employeesSectionTitle]}>Employees</Text>
          <FlatList data={emps} renderItem={renderEmp} keyExtractor={i => `${i.employeeId}`} scrollEnabled={false} />
        </ScrollView>
      )}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => { setModal(false); setSchedule(null); }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selEmp ? `${selEmp.name}'s Schedule` : 'Weekly Schedule'}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.scheduleContainer}>
                <View style={styles.timeColumn}>
                  <View style={[styles.timeSlotHeader, styles.cornerCell]}><Text style={styles.timeText}>Time</Text></View>
                  {timeSlots.map(s => <View key={s} style={styles.timeSlot}><Text style={styles.timeText}>{s}</Text></View>)}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {weekDays.map(d => (
                    <View key={d} style={styles.dayColumn}>
                      <View style={styles.dayHeader}><Text style={styles.dayText}>{d}</Text></View>
                      {timeSlots.map(slot => {
                        const apps = getAppointmentsForTimeSlot(slot, d);
                        return (
                          <View key={`${d}-${slot}`} style={styles.scheduleCell}>
                            {apps.map(app => (
                              <View key={app.appointmentId} style={styles.scheduledAppointment}>
                                <Text numberOfLines={2} ellipsizeMode="tail" style={styles.appointmentText}>{`${app.serviceName} - ${app.customerName}`}</Text>
                              </View>
                            ))}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            {selAppt && selEmp && (
              <TouchableOpacity style={[styles.assignButton, assigning && { opacity: .6 }]} onPress={assign} disabled={assigning}>
                {assigning ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.assignButtonText}>Assign selected appointment</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => { setModal(false); setSchedule(null); }}><Text style={styles.closeButtonText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    color: '#388E3C',
  },
  scrollContainer: {
    flex: 1,
  },
  wideContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  widePendingContainer: {
    flex: 0.6,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  wideEmployeesContainer: {
    flex: 0.4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  employeesSectionTitle: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  appointmentList: {
    flex: 1,
    maxHeight: 400,
  },
  appointmentRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedRow: {
    backgroundColor: '#C8E6C9',
  },
  appointmentCell: {
    flex: 1,
    textAlign: 'center',
  },
  employeeList: {
    flex: 1,
    maxHeight: 300,
  },
  employeeItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  employeeName: {
    fontSize: 16,
  },
  emptyListText: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleContainer: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 70,
  },
  cornerCell: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  timeSlot: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  timeSlotHeader: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
  },
  dayColumn: {
    width: 100,
  },
  dayHeader: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },
  dayText: {
    fontWeight: 'bold',
  },
  scheduleCell: {
    height: 60,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 2,
  },
  scheduledAppointment: {
    backgroundColor: '#81C784',
    borderRadius: 4,
    padding: 2,
    margin: 1,
    maxHeight: 56,
  },
  appointmentText: {
    fontSize: 10,
    color: '#fff',
  },
  assignButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 16,
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    color: '#666',
  },
});

export default AdminAssignmentScreen;