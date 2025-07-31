import { createRoot } from 'react-dom/client';
import '@/assets/styles/index.scss';
import App from './App.tsx';
import 'virtual:uno.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import store from '@/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from '@/store';
const queryClient = new QueryClient();
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import { BrowserRouter } from 'react-router-dom';
import { RoutesProvider } from '@/router/context/routesContext.tsx';
createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN}>
          <BrowserRouter>
            <RoutesProvider>
              <App />
            </RoutesProvider>
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>,
);
