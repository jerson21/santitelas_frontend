import { useContext } from 'react';
import PendingValidationsContext from '../contexts/PendingValidationsContext';

export const usePendingValidations = () => {
  const context = useContext(PendingValidationsContext);
  if (context === undefined) {
    throw new Error('usePendingValidations must be used within a PendingValidationsProvider');
  }
  return context;
};