// src/screens/UserDetailScreens.tsx
// Full, corrected screens for viewing and editing a user

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import apiClient from '../api/apiClient';

type Role = 'employee' | 'admin';
interface UserDto {
  userId: number;          // field from backend entity
  id?: number;             // convenience alias used by RN
  username: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  // employee extras
  skillset?: string;
  availability?: string;
  location?: string;
}

/*───────────────────────────  USER DETAILS  ───────────────────────────*/
export const UserDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, { userId: number }>, string>>();
  const { userId } = route.params;
  const [user, setUser]   = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await apiClient.get<UserDto>(`/users/${userId}`);
      // add .id so downstream code never sees undefined
      setUser({ ...data, id: data.userId });
    } catch (err) {
      Alert.alert('Error', 'Could not load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Center><ActivityIndicator size="large"/></Center>;
  if (!user)    return <Center><Text>User not found</Text></Center>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title text="User Details" />
      <Info label="Username"   value={user.username} />
      <Info label="Email"      value={user.email} />
      <Info label="Phone"      value={user.phoneNumber} />
      <Info label="Role"       value={user.role.toUpperCase()} />
      {user.role === 'employee' && (
        <>
          <Info label="Skillset"     value={user.skillset} />
          <Info label="Availability" value={user.availability} />
          <Info label="Location"     value={user.location} />
        </>
      )}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => navigation.navigate('EditUser', { userId: user.userId, role: user.role })}
      >
        <Text style={styles.btnText}>Edit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

/*───────────────────────────  EDIT USER  ───────────────────────────*/
export const EditUserScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, { userId: number; role: Role }>, string>>();
  const { userId, role } = route.params;

  const [user,    setUser]  = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get<UserDto>(`/users/${userId}`);
        setUser({ ...data, id: data.userId });
      } catch { Alert.alert('Error', 'Could not load user'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <Center><ActivityIndicator size="large"/></Center>;
  if (!user)    return <Center><Text>User not found</Text></Center>;

  const save = async () => {
    if (!user.username || !user.email) {
      Alert.alert('Validation', 'Username & Email required');
      return;
    }
    try {
      setSaving(true);
      await apiClient.put(`/admin/update-user/${user.userId}`, {
        username:     user.username,
        password:     undefined,          // no password change here
        email:        user.email,
        phoneNumber:  user.phoneNumber,
        role:         user.role.toUpperCase(),
        skillset:     user.skillset,
        availability: user.availability,
        location:     user.location,
      });
      Alert.alert('Saved', 'User updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err:any) {
      Alert.alert('Error', err.response?.data || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Title text={`Edit ${role.charAt(0).toUpperCase() + role.slice(1)}`} />

      <Label text="Username" />
      <Input value={user.username} onChange={t => setUser({ ...user!, username: t })} />

      <Label text="Email" />
      <Input value={user.email}    onChange={t => setUser({ ...user!, email: t })} keyboard="email-address" />

      <Label text="Phone" />
      <Input value={user.phoneNumber} onChange={t => setUser({ ...user!, phoneNumber: t })} keyboard="phone-pad" />

      {role === 'employee' && (
        <>
          <Label text="Skillset" />
          <Input value={user.skillset} onChange={t => setUser({ ...user!, skillset: t })} />

          <Label text="Availability" />
          <Input value={user.availability} onChange={t => setUser({ ...user!, availability: t })} />

          <Label text="Location" />
          <Input value={user.location} onChange={t => setUser({ ...user!, location: t })} />
        </>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

/*───────────────────────────  UI helpers  ───────────────────────────*/
const Center: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.center}>{children}</View>
);

const Title: React.FC<{ text: string }> = ({ text }) => (
  <Text style={styles.title}>{text}</Text>
);

const Label: React.FC<{ text: string }> = ({ text }) => (
  <Text style={styles.label}>{text}</Text>
);

const Info: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value ?? '-'}</Text>
  </View>
);

const Input = ({ value, onChange, keyboard }: { value?: string | null; onChange: (t: string) => void; keyboard?: any }) => (
  <TextInput
    style={styles.input}
    value={value ?? ''}
    onChangeText={onChange}
    keyboardType={keyboard}
  />
);

/*───────────────────────────  STYLES  ───────────────────────────*/
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title:     { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  infoLabel: { fontWeight: '600', color: '#555' },
  infoValue: { color: '#222' },
  label:     { fontSize: 14, fontWeight: '500', marginTop: 12, color: '#444' },
  input:     { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginTop: 4 },
  primaryBtn:{ backgroundColor: '#388E3C', padding: 15, borderRadius: 6, alignItems: 'center', marginTop: 24 },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
});
