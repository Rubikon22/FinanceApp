import NetInfo from '@react-native-community/netinfo';

/** Returns true if the device has an active internet connection. */
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
};

/**
 * Subscribe to network changes.
 * Calls the callback with the current connectivity status.
 * Returns an unsubscribe function.
 */
export const subscribeToNetwork = (
  callback: (online: boolean) => void
): (() => void) => {
  return NetInfo.addEventListener((state) => {
    const online = state.isConnected === true && state.isInternetReachable !== false;
    callback(online);
  });
};
