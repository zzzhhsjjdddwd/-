import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.js';
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';
import Dishes from './pages/Dishes.js';
import Categories from './pages/Categories.js';
import Orders from './pages/Orders.js';
import Tables from './pages/Tables.js';
import Members from './pages/Members.js';
import StaffPage from './pages/Staff.js';
import Reports from './pages/Reports.js';
import SettingsPage from './pages/Settings.js';
import { Toasts } from './components/Toast.js';
import { useAuth } from './stores/auth.js';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="dishes" element={<Dishes />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tables" element={<Tables />} />
          <Route path="members" element={<Members />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <Toasts />
    </>
  );
}
