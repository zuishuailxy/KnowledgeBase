import { useSyncExternalStore } from "react";

export const useStorage = <T>(key: string, initialValue: T) => {
  // Subscriber
  const subscribe = (callback: () => void) => {
    // 订阅 API
    window.addEventListener("storage", callback);

    return () => {
      // 取消订阅
      window.removeEventListener("storage", callback);
    };
  };

  // Snapshot 获取函数
  const getSnapshot = () => {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : initialValue;
  };

  const res = useSyncExternalStore(subscribe, getSnapshot);

  const updateStorage = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
    // 手动触发 storage 事件，通知所有订阅者
    window.dispatchEvent(new StorageEvent("storage"));
  };
  return [res, updateStorage];
};
