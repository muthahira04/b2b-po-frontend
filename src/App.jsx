import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VendorList from './pages/vendors/VendorList';
import VendorForm from './pages/vendors/VendorForm';
import POList from './pages/po/POList';
import POCreate from './pages/po/POCreate';
import PODetail from './pages/po/PODetail';

// Layout
import Layout from './components/layout/Layout';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="vendors" element={<VendorList />} />
        <Route path="vendors/new" element={<VendorForm />} />
        <Route path="vendors/:id/edit" element={<VendorForm />} />
        <Route path="po" element={<POList />} />
        <Route path="po/new" element={<POCreate />} />
        <Route path="po/:id" element={<PODetail />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;