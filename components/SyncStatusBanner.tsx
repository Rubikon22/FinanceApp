import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStatus } from '@/store/useSyncStatus';
import { syncWithCloud } from '@/services/sync';

const BANNER_HEIGHT = 52;
const SUCCESS_AUTO_HIDE_MS = 2500;

export const SyncStatusBanner: React.FC = () => {
  const { syncState, errorMessage, pendingCount, clearError, setSyncing } = useSyncStatus();
  const translateY = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVisible = syncState === 'syncing' || syncState === 'error' || syncState === 'success' || syncState === 'offline';

  useEffect(() => {
    if (successTimer.current) {
      clearTimeout(successTimer.current);
      successTimer.current = null;
    }

    Animated.timing(translateY, {
      toValue: isVisible ? 0 : -BANNER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (syncState === 'success') {
      successTimer.current = setTimeout(() => {
        useSyncStatus.getState().clearError();
      }, SUCCESS_AUTO_HIDE_MS);
    }

    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, [syncState, isVisible]);

  const handleRetry = useCallback(async () => {
    clearError();
    setSyncing();
    await syncWithCloud();
  }, [clearError, setSyncing]);

  if (!isVisible) return null;

  const isError = syncState === 'error';
  const isSyncing = syncState === 'syncing';
  const isSuccess = syncState === 'success';
  const isOffline = syncState === 'offline';

  return (
    <Animated.View
      style={[
        styles.banner,
        isError && styles.errorBanner,
        isSuccess && styles.successBanner,
        isOffline && styles.offlineBanner,
        { transform: [{ translateY }] },
      ]}
    >
      {isSyncing && <ActivityIndicator size="small" color="#fff" />}
      {isError && <Ionicons name="cloud-offline-outline" size={18} color="#fff" />}
      {isSuccess && <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
      {isOffline && <Ionicons name="wifi-outline" size={18} color="#fff" />}

      <View style={styles.messageContainer}>
        <Text style={styles.message} numberOfLines={1}>
          {isSyncing && 'Synchronizacja...'}
          {isSuccess && 'Zsynchronizowano'}
          {isError && (errorMessage ?? 'Błąd synchronizacji')}
          {isOffline && 'Synchronizacja wyłączona'}
        </Text>
        {isOffline && pendingCount > 0 && (
          <Text style={styles.subMessage}>
            {pendingCount} {pendingCount === 1 ? 'zmiana' : 'zmiany'} oczekuje na wysłanie
          </Text>
        )}
      </View>

      {isError && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={styles.retryText}>Ponów</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearError} style={styles.closeButton}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {isOffline && pendingCount > 0 && (
        <View style={[styles.pendingBadge]}>
          <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: '#6C5CE7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    zIndex: 999,
    elevation: 10,
  },
  errorBanner: {
    backgroundColor: '#D63031',
  },
  successBanner: {
    backgroundColor: '#00B894',
  },
  offlineBanner: {
    backgroundColor: '#636E72',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  subMessage: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    padding: 2,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
