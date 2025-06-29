// /src/components/cajero/hooks/useToast.js
import { useState, useCallback } from 'react';

const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info', autoClose = true) => {
    setToast({ message, type, autoClose });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast
  };
};

export default useToast;