import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

export interface Photo {
  id: number;
  filename: string;
  contentType: string;
  uploadedAt: string;
}

const UploadPhotoScreen: React.FC = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Pick image from gallery
  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
      if (res.didCancel) return;
      if (res.errorCode) Alert.alert('Error', res.errorMessage ?? 'Could not open gallery');
      else if (res.assets?.length) setImage(res.assets[0]);
    });
  };

  // Upload image to server
  const upload = async () => {
    if (!image) return Alert.alert('Choose an image first');

    const data = new FormData();
    data.append('file', {
      name: image.fileName ?? `photo_${Date.now()}.jpg`,
      type: image.type ?? 'image/jpeg',
      uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
    } as any);

    setLoading(true);
    try {
      const res = await apiClient.post<Photo>('/customer/photos', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert(
        'Success',
        `Photo saved\nUploaded: ${new Date(res.data.uploadedAt).toLocaleString()}`,
        [
          { 
            text: 'View my photos', 
            onPress: () => navigation.navigate('PhotoGalleryScreen') 
          },
          { 
            text: 'OK', 
            style: 'default',
          }
        ]
      );
      setImage(null);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Upload failed', err?.response?.data?.message ?? 'Try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Photo</Text>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={() => navigation.navigate('PhotoGalleryScreen')}
        >
          <Text style={styles.galleryButtonText}>My Photos</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.container}>
        {image ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: image.uri }} style={styles.preview} />
            <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
              <Text style={styles.changeButtonText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.placeholderContainer} onPress={pickImage}>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Tap to select a photo</Text>
            </View>
          </TouchableOpacity>
        )}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.uploadButton, !image && styles.uploadButtonDisabled]}
            onPress={upload}
            disabled={!image}
          >
            <Text style={styles.uploadButtonText}>Upload Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#388E3C',
    backgroundColor: '#388E3C',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  galleryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#424242',
  },
  galleryButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  preview: {
    width: 280,
    height: 280,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  placeholderContainer: {
    marginBottom: 24,
  },
  placeholder: {
    width: 280,
    height: 280,
    borderRadius: 8,
    backgroundColor: '#424242',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#388E3C',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    width: '80%',
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#4CAF50',
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#4CAF50',
  },
});

export default UploadPhotoScreen;