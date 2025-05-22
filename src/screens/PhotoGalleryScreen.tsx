import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
  FlatList,
  RefreshControl,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import { Photo } from './UploadPhotoScreen';

const PhotoGalleryScreen: React.FC = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Calculate grid dimensions
  const screenWidth = Dimensions.get('window').width;
  const numColumns = 2;
  const spacing = 1;
  const itemWidth = (screenWidth - (numColumns + 1) * spacing) / numColumns;

  // Fetch photos from API
  const fetchPhotos = useCallback(async () => {
    try {
      const response = await apiClient.get<Photo[]>('/customer/photos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPhotos(response.data);
      setError(false);
    } catch (err) {
      console.error('Failed to fetch photos:', err);
      setError(true);
      if (!refreshing) {
        Alert.alert('Error', 'Couldn\'t load photos. Pull to refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, refreshing]);

  // Initial load
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPhotos();
  }, [fetchPhotos]);

  // Open photo preview modal
  const openPhotoPreview = (photo: Photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  // Close photo preview modal
  const closePhotoPreview = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedPhoto(null), 300);
  };

  // Delete photo
  const deletePhoto = (photo: Photo) => {
    Alert.alert(
      'Delete photo?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/customer/photos/${photo.id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              // Remove photo from state without refreshing the whole list
              setPhotos(current => current.filter(p => p.id !== photo.id));
            } catch (err) {
              console.error('Failed to delete photo:', err);
              Alert.alert('Error', 'Failed to delete photo. Please try again.');
            }
          },
        },
      ],
    );
  };

  // Navigate to upload screen
  const goToUpload = () => {
    navigation.navigate('UploadPhotoScreen' as never);
  };

  // Render photo item
  const renderPhotoItem = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={[styles.photoItem, { width: itemWidth, height: itemWidth }]}
      onPress={() => openPhotoPreview(item)}
      onLongPress={() => deletePhoto(item)}
    >
      <Image
        source={{
          uri: `${apiClient.defaults.baseURL}/customer/photos/${item.id}`,
          headers: { Authorization: `Bearer ${token}` },
        }}
        style={styles.thumbnail}
      />
      <TouchableOpacity
        style={styles.trashButton}
        onPress={() => deletePhoto(item)}
      >
        <View style={styles.trashIconContainer}>
          <Text style={styles.trashIcon}>🗑️</Text>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Show loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>My Photos</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={goToUpload}>
          <Text style={styles.uploadButtonText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {photos.length === 0 && !loading && !error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No photos yet</Text>
          <TouchableOpacity style={styles.uploadButtonLarge} onPress={goToUpload}>
            <Text style={styles.uploadButtonText}>+ Upload Your First Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={styles.photoGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Photo Preview Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePhotoPreview}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closePhotoPreview}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {selectedPhoto && (
            <Image
              source={{
                uri: `${apiClient.defaults.baseURL}/customer/photos/${selectedPhoto.id}`,
                headers: { Authorization: `Bearer ${token}` },
              }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  uploadButton: {
    backgroundColor: '#424242',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  uploadButtonLarge: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 16,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  photoGrid: {
    padding: 10,
  },
  photoItem: {
    margin: 10,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  trashButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    zIndex: 10,
  },
  trashIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#424242',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trashIcon: {
    fontSize: 14,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(66, 66, 66, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#388E3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PhotoGalleryScreen;