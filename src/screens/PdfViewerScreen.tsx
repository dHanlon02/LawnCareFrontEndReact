// screens/PdfViewerScreen.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import Pdf from 'react-native-pdf';
import Share from 'react-native-share';
import { useRoute, useNavigation } from '@react-navigation/native';

const PdfViewerScreen: React.FC = () => {
  // no explicit Props interface needed
  const route = useRoute();
  const navigation = useNavigation();
  const { uri } = (route.params as { uri: string });

  const onShare = async () => {
    try {
      await Share.open({ url: uri, type: 'application/pdf' });
    } catch {
      Alert.alert('Error', 'Could not share PDF');
    }
  };

  return (
    <View style={styles.container}>
      <Pdf source={{ uri }} style={styles.pdf} />
      <View style={styles.buttons}>
        <TouchableOpacity onPress={onShare} style={styles.button}>
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default PdfViewerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  pdf: { flex: 1 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  button: { padding: 12, backgroundColor: '#0066cc', borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
