/**
 * BUTTERFLY — useDevice Hook
 * Responsive layout detection with debounced resize handling.
 */

import { useState, useEffect } from 'react';
import { getDeviceType, isTouchDevice, type DeviceType } from '../utils/device';
import { ScrollTrigger } from '../animations/gsapInit';

export interface DeviceInfo {
  deviceType: DeviceType;
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    const type = getDeviceType();
    return {
      deviceType: type,
      isTouch: isTouchDevice(),
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const type = getDeviceType();
        setDeviceInfo({
          deviceType: type,
          isTouch: isTouchDevice(),
          isMobile: type === 'mobile',
          isTablet: type === 'tablet',
          isDesktop: type === 'desktop',
        });
        ScrollTrigger.refresh();
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return deviceInfo;
}

