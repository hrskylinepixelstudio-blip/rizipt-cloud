import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/marketing/LandingPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ComingSoonPage from './pages/ComingSoonPage.jsx';
import CompanyProfilePage from './pages/settings/CompanyProfilePage.jsx';
import BillingListPage from './pages/billing/BillingListPage.jsx';
import CreateDocumentPage from './pages/billing/CreateDocumentPage.jsx';
import DocumentViewPage from './pages/billing/DocumentViewPage.jsx';
import CrmPage from './pages/crm/CrmPage.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import { useAuthStore } from './store/authStore.js';

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <Routes>
      <Route path="/" element={accessToken ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pos" element={<ComingSoonPage title="Point of Sale" />} />
          <Route path="/billing" element={<BillingListPage />} />
          <Route path="/billing/new" element={<CreateDocumentPage />} />
          <Route path="/billing/:id/edit" element={<CreateDocumentPage />} />
          <Route path="/billing/:id" element={<DocumentViewPage />} />
          <Route path="/products" element={<ComingSoonPage title="Products" />} />
          <Route path="/inventory" element={<ComingSoonPage title="Inventory" />} />
          <Route path="/customers" element={<ComingSoonPage title="Customers" />} />
          <Route path="/suppliers" element={<ComingSoonPage title="Suppliers" />} />
          <Route path="/expenses" element={<ComingSoonPage title="Expenses" />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/reports" element={<ComingSoonPage title="Reports" />} />
          <Route path="/settings" element={<CompanyProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
