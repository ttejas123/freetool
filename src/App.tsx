import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

function App() {
  return (
    <HelmetProvider>
      {router && <RouterProvider router={router} />}
    </HelmetProvider>
  );
}

export default App;
