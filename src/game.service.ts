/**
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple reactive Signal class to emulate Angular Signals behavior in a React environment
export class Signal<T> {
  private value: T;
  private listeners = new Set<(val: T) => void>();

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  // Returns the current value
  get(): T {
    return this.value;
  }

  // Set next state value and notify all subscribers reactive updates
  set(newValue: T): void {
    if (this.value !== newValue) {
      this.value = newValue;
      this.listeners.forEach((listener) => listener(newValue));
    }
  }

  // Let React components or other files track changes effortlessly
  subscribe(listener: (val: T) => void): () => void {
    this.listeners.add(listener);
    listener(this.value); // Trigger initial run immediately
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function signal<T>(initialValue: T): Signal<T> {
  return new Signal<T>(initialValue);
}

// 1. PWA installation state tracking signals
export const isInstallable = signal<boolean>(false);
export const isInstalledMode = signal<boolean>(false);

// Stores the intercepted beforeinstallprompt event object
let deferredPrompt: any = null;

export function getDeferredPrompt(): any {
  return deferredPrompt;
}

export function clearDeferredPrompt(): void {
  deferredPrompt = null;
  isInstallable.set(false);
}

// Check stand-alone PWA mode immediately on load
export function initInstallTracking(): void {
  if (typeof window !== 'undefined') {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
      
    if (isStandalone) {
      isInstalledMode.set(true);
    }

    // Capture the native beforeinstallprompt event trigger
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault(); // Stop default browser prompt
      deferredPrompt = e;
      isInstallable.set(true);
    });

    // Detect if PWA was successfully installed by user
    window.addEventListener('appinstalled', () => {
      console.log('Block Blast Pro was successfully installed!');
      isInstalledMode.set(true);
      clearDeferredPrompt();
    });
  }
}
