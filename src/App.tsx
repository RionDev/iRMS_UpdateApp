import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@common/pages/LoginPage';
import { SignupPage } from '@common/pages/SignupPage';
import { useAuthStore } from '@common/stores/authStore';
import { updateRoutes } from './routes';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    window.location.href = '/update/login?redirect=' + encodeURIComponent(window.location.pathname);
    return null;
  }
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage signupUrl="/update/signup" defaultRedirect="/update/signals" />} />
      <Route path="/signup" element={<SignupPage loginUrl="/update/login" />} />
      <Route path="/signals" element={<RequireAuth>{updateRoutes.signals}</RequireAuth>} />
      <Route path="/logs" element={<RequireAuth>{updateRoutes.logs}</RequireAuth>} />
      <Route path="/requests" element={<RequireAuth>{updateRoutes.requests}</RequireAuth>} />
      <Route path="/targets" element={<RequireAuth>{updateRoutes.targets}</RequireAuth>} />
      <Route path="/schedule" element={<RequireAuth>{updateRoutes.schedule}</RequireAuth>} />
      <Route path="*" element={<Navigate to="/signals" replace />} />
    </Routes>
  );
}
