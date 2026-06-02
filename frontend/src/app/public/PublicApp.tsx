import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import TenantLoginPage from './pages/TenantLoginPage';

export default function PublicApp() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<TenantLoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
