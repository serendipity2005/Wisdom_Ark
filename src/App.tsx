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

function App() {
  const routes = useAppRouter();
  return (
    <div className="App">
      {/* <Test />
      <Button>123</Button> */}
      <Suspense fallback={<div>Loading...</div>}>{useRoutes(routes)}</Suspense>
    </div>
  );
}
export default App;
