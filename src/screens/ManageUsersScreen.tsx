// src/screens/ManageUsersScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import apiClient from '../api/apiClient';
import { useNavigation } from '@react-navigation/native';

interface User {
  userId: number;
  name:    string;
  email:   string;
  role:    'employee'|'admin';
}



const ManageUsersScreen = () => {
  const navigation = useNavigation<any>();
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;

  const [sections, setSections] = useState<{ title: string; data: User[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      if (!refreshing) setLoading(true);
      // ← no leading '/api' here
      const { data } = await apiClient.get<User[]>('/users');
      setSections([
        { title: 'Employees',      data: data.filter(u => u.role === 'employee') },
        { title: 'Administrators', data: data.filter(u => u.role === 'admin')    },
      ]);
    } catch (err: any) {
      console.error('Failed to load users', err);
      Alert.alert('Error', err.response?.data || 'Could not load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (userId: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              // ← no leading '/api' here either
              await apiClient.delete(`/admin/delete-user/${userId}`);
              loadUsers();
            } catch (err: any) {
              console.error('Delete failed', err);
              Alert.alert('Error', err.response?.data || 'Could not delete user.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#388E3C" />
      </View>
    );
  }

  const renderHeader = ({ section: { title } }: any) => {
    const roleParam = title === 'Employees' ? 'employee' : 'admin';
    return (
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>{title}</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('AddUser', { role: roleParam })}
        >
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('UserDetails', { userId: item.userId })}>
          <Text style={styles.viewText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('EditUser', { userId: item.userId, role: item.role })}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.userId)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.userId.toString()}
        renderSectionHeader={renderHeader}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadUsers(); }}
            tintColor="#388E3C"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        )}
      />
    </Animated.View>
  );
};

export default ManageUsersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeaderContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#388E3C', paddingVertical: 8, paddingHorizontal: 16,
  },
  sectionHeader:  { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  createBtn:       { backgroundColor: '#fff', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4 },
  createBtnText:   { color: '#388E3C', fontWeight: '600' },
  userCard:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16 },
  userInfo:        { flex: 1 },
  userName:        { fontSize: 16, fontWeight: '600' },
  userEmail:       { fontSize: 14, color: '#555', marginTop: 4 },
  actions:         { flexDirection: 'row' },
  viewText:        { marginRight: 16, color: '#1976D2', fontWeight: '600' },
  editText:        { marginRight: 16, color: '#388E3C', fontWeight: '600' },
  deleteText:      { color: '#D32F2F', fontWeight: '600' },
  separator:       { height: 1, backgroundColor: '#eee', marginHorizontal: 16 },
  emptyText:       { textAlign: 'center', color: '#888', fontSize: 16, marginTop: 20 },
});
