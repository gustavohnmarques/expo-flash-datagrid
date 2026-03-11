import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardInset(enabled: boolean): number {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setKeyboardInset((previous) => (previous === 0 ? previous : 0));
      return;
    }

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const nextInset = Math.max(0, event.endCoordinates?.height ?? 0);
      setKeyboardInset((previous) =>
        previous === nextInset ? previous : nextInset
      );
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset((previous) => (previous === 0 ? previous : 0));
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [enabled]);

  return keyboardInset;
}
