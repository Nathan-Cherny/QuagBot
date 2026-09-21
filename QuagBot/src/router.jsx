import { createBrowserRouter } from 'react-router';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import About from './pages/About';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
    ],
  },
]);

export default router;   // <-- router.jsx exports the router object, nothing else