import { useCallback, useState } from 'react';

export function useControlledState<T>(
  controlledValue: T | undefined,
  defaultValue: T
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<T>(defaultValue);

  const value = isControlled ? (controlledValue as T) : uncontrolledValue;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      if (isControlled) {
        return;
      }

      setUncontrolledValue((previous) =>
        typeof next === 'function'
          ? (next as (prev: T) => T)(previous)
          : (next as T)
      );
    },
    [isControlled]
  );

  return [value, setValue, isControlled];
}
