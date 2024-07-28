import React, { useState } from "react";

interface useLocalStorageProps<T> {
  storageKey: string;
  initialValue?: T;
}

export const useLocalStorage = <T>({
  storageKey,
  initialValue,
}: useLocalStorageProps<T>): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const initialValueJson = localStorage.getItem(storageKey);
  const [value, setValue] = useState<T>(
    initialValue ??
      (initialValueJson ? JSON.parse(initialValueJson) : initialValue),
  );

  const setValueWithLocalStorage = (newValue: React.SetStateAction<T>) => {
    const valueToStore =
      newValue instanceof Function ? newValue(value) : newValue;
    setValue(valueToStore);
    localStorage.setItem(storageKey, JSON.stringify(valueToStore));
  };

  return [value, setValueWithLocalStorage];
};
