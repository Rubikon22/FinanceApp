import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Colors } from '@/constants/colors';

interface Props {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

const RECEIPTS_DIR = FileSystem.documentDirectory + 'receipts/';

const ensureReceiptsDir = async () => {
  const info = await FileSystem.getInfoAsync(RECEIPTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECEIPTS_DIR, { intermediates: true });
  }
};

const copyToAppStorage = async (sourceUri: string): Promise<string> => {
  await ensureReceiptsDir();
  const filename = `receipt_${Date.now()}.jpg`;
  const destUri = RECEIPTS_DIR + filename;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
};

export const ReceiptPicker: React.FC<Props> = ({ uri, onChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const requestAndPick = async (source: 'camera' | 'gallery') => {
    setIsLoading(true);
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Brak uprawnień', 'Zezwól aplikacji na dostęp do aparatu w ustawieniach.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [3, 4],
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Brak uprawnień', 'Zezwól aplikacji na dostęp do galerii w ustawieniach.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [3, 4],
        });
      }

      if (!result.canceled && result.assets[0]) {
        const savedUri = await copyToAppStorage(result.assets[0].uri);
        onChange(savedUri);
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się załadować zdjęcia.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    Alert.alert('Zdjęcie paragonu', 'Wybierz źródło', [
      { text: 'Aparat', onPress: () => requestAndPick('camera') },
      { text: 'Galeria', onPress: () => requestAndPick('gallery') },
      { text: 'Anuluj', style: 'cancel' },
    ]);
  };

  const handleRemove = () => {
    Alert.alert('Usuń zdjęcie', 'Czy chcesz usunąć zdjęcie paragonu?', [
      { text: 'Usuń', style: 'destructive', onPress: () => onChange(null) },
      { text: 'Anuluj', style: 'cancel' },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Ładowanie zdjęcia...</Text>
      </View>
    );
  }

  if (uri) {
    return (
      <>
        <TouchableOpacity style={styles.thumbnailContainer} onPress={() => setPreviewVisible(true)} activeOpacity={0.8}>
          <Image source={{ uri }} style={styles.thumbnail} resizeMode="cover" />
          <View style={styles.thumbnailOverlay}>
            <Ionicons name="expand-outline" size={18} color="#fff" />
            <Text style={styles.thumbnailOverlayText}>Powiększ</Text>
          </View>
          <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
            <Ionicons name="close-circle" size={22} color={Colors.expense} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Full-screen preview modal */}
        <Modal
          visible={previewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <View style={styles.previewOverlay}>
            <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image
              source={{ uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      </>
    );
  }

  return (
    <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.7}>
      <Ionicons name="camera-outline" size={22} color={Colors.primary} />
      <Text style={styles.addButtonText}>Dodaj zdjęcie paragonu</Text>
    </TouchableOpacity>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  thumbnailContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 140,
    backgroundColor: Colors.surface,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 6,
  },
  thumbnailOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  previewImage: {
    width,
    height: height * 0.85,
  },
});
