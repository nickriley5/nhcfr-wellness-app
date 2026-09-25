import { getFunctions } from 'firebase/functions';
import { firebaseApp } from '../../firebaseCore';

export const getAIFunctions = () => getFunctions(firebaseApp, 'us-central1');
