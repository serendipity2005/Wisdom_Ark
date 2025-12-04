import { Suspense } from 'react';
import './App.scss';
import '@/mock';

// import useRouter from '@/router/index';
// import routes from '~react-pages';
// function App() {
//   return (
//     <div className="App">
//         {/* <Test />
//       <Button>123</Button> */}
//       <Suspense fallback={<div>Loading...</div>}>
//         <RouterProvider router={router}></RouterProvider>
//       </Suspense>
//     </div>
//   );
// }
import { useRoutes } from 'react-router-dom';
// import { staticRouter } from './router';
import { useAppRouter } from './router';
import { useAuth } from '@/contexts/authContext';
import { AuthProvider } from '@/contexts/authContext';
import LoginRegisterModal from '@/components/LoginForm';

// function App() {
//   const routes = useAppRouter();
//   console.log(routes);
//   const { isLoginModalVisible, hideLoginModal, login } = useAuth();
//   return (
//     <div className="App">
//       {/* <Test />
//       <Button>123</Button> */}
//       <AuthProvider>
//         <LoginRegisterModal
//           open={isLoginModalVisible}
//           onCancel={hideLoginModal}
//           onLogin={login}
//         />
//         <Suspense fallback={<div>Loading...</div>}>
//           {useRoutes(routes)}
//         </Suspense>
//       </AuthProvider>
//     </div>
//   );
// }
function AppContent({ routes }: { routes: ReturnType<typeof useAppRouter> }) {
  const { isLoginModalVisible, hideLoginModal, login } = useAuth();

  return (
    <>
      <LoginRegisterModal
        open={isLoginModalVisible}
        onCancel={hideLoginModal}
        onLogin={login}
      />
      <Suspense fallback={<div>Loading...</div>}>{useRoutes(routes)}</Suspense>
    </>
  );
}
function App() {
  const routes = useAppRouter();

  return (
    <div className="App">
      <AuthProvider>
        <AppContent routes={routes} />
      </AuthProvider>
    </div>
  );
}
export default App;
