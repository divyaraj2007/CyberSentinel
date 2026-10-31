import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NetworkDiscoveryPage } from './pages/NetworkDiscoveryPage';
import { PortScannerPage } from './pages/PortScannerPage';
import { TrafficAnalyzerPage } from './pages/TrafficAnalyzerPage';
import { IntrusionDetectionPage } from './pages/IntrusionDetectionPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { ThreatIntelPage } from './pages/ThreatIntelPage';
import { CiscoMonitoringPage } from './pages/CiscoMonitoringPage';
import { TopologyPage } from './pages/TopologyPage';
import { AlertsManagementPage } from './pages/AlertsManagementPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ForensicsPage } from './pages/ForensicsPage';
import { ResponseAutomationPage } from './pages/ResponseAutomationPage';
import { NetworkHealthPage } from './pages/NetworkHealthPage';
import { ReportsPage } from './pages/ReportsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#07090e] flex items-center justify-center text-cyan-400 font-mono text-xs">
        AUTHENTICATING CYBERSENTINEL SESSION...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="discovery" element={<NetworkDiscoveryPage />} />
              <Route path="scanner" element={<PortScannerPage />} />
              <Route path="traffic" element={<TrafficAnalyzerPage />} />
              <Route path="ids" element={<IntrusionDetectionPage />} />
              <Route path="vulnerabilities" element={<VulnerabilitiesPage />} />
              <Route path="threat-intel" element={<ThreatIntelPage />} />
              <Route path="cisco" element={<CiscoMonitoringPage />} />
              <Route path="topology" element={<TopologyPage />} />
              <Route path="alerts" element={<AlertsManagementPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="forensics" element={<ForensicsPage />} />
              <Route path="response" element={<ResponseAutomationPage />} />
              <Route path="health" element={<NetworkHealthPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;
