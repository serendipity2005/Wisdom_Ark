import { createRoot } from 'react-dom/client';
import '@/assets/styles/index.scss';
import App from './App.tsx';
import 'virtual:uno.css';
createRoot(document.getElementById('root')!).render(<App />);
