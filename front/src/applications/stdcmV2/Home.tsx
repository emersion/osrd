import React from 'react';

import { Route, Routes } from 'react-router-dom';

import OSRDSTDCM from './views/OSRDSTDCM';

export default function HomeStdcmV2() {
  return (
    <Routes>
      <Route path="" element={<OSRDSTDCM />} />
    </Routes>
  );
}
