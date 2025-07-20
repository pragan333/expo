import { NativeModule, registerWebModule } from 'expo-modules-core';

import { NetworkEvents, NetworkState, NetworkStateType } from './Network.types';

const onNetworkStateEventName = 'onNetworkStateChanged';

function getNetworkState(): NetworkState {
  const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
  return {
    type: isOnline ? NetworkStateType.UNKNOWN : NetworkStateType.NONE,
    isConnected: isOnline,
    isInternetReachable: isOnline,
  };
}

class ExpoNetworkModule extends NativeModule<NetworkEvents> {
  eventListener?: () => void;
  updateNetworkState() {
    const state = getNetworkState();
    this.emit(onNetworkStateEventName, state);
  }

  async getIpAddressAsync(): Promise<string> {
    try {
      const resp = await fetch('https://api.ipify.org?format=json');
      const data = await resp.json();
      return data.ip;
    } catch (e) {
      throw e;
    }
  }
  async getNetworkStateAsync(): Promise<NetworkState> {
    return getNetworkState();
  }
  async isAirplaneModeEnabledAsync(): Promise<boolean> {
    return false;
  }
  startObserving() {
    if (typeof window === 'undefined') {
      return;
    }
    this.eventListener = () => this.updateNetworkState();
    window.addEventListener('online', this.eventListener);
    window.addEventListener('offline', this.eventListener);
  }
  stopObserving() {
    if (typeof window === 'undefined' || !this.eventListener) {
      return;
    }
    window.removeEventListener('online', this.eventListener);
    window.removeEventListener('offline', this.eventListener);
    this.eventListener = undefined;
  }
}

export default registerWebModule(ExpoNetworkModule, 'ExpoNetwork');
