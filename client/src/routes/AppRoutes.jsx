import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MWQRoutes from '../modules/MWQ/routes/MWQRoutes';
import AQMSRoutes from '../modules/AQMS/routes/AQMSRoutes';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Route to MWQ module */}
      <Route path="/MWQ/*" element={<MWQRoutes />} />

      {/* Route to AQMS module */}
      <Route path="/AQMS/*" element={<AQMSRoutes />} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/MWQ" replace />} />
      <Route path="*" element={<Navigate to="/MWQ" replace />} />
    </Routes>
  );
};

export default AppRoutes;
