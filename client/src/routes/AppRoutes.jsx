import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MQWRoutes from '../modules/MQW/routes/MQWRoutes';
import AQMSRoutes from '../modules/AQMS/routes/AQMSRoutes';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Route to MQW module */}
      <Route path="/MQW/*" element={<MQWRoutes />} />

      {/* Route to AQMS module */}
      <Route path="/AQMS/*" element={<AQMSRoutes />} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/MQW" replace />} />
      <Route path="*" element={<Navigate to="/MQW" replace />} />
    </Routes>
  );
};

export default AppRoutes;
