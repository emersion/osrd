import React from 'react';

import { Route, Routes } from 'react-router-dom';

import StdcmViewV2 from './views/StdcmViewV2';

export default function HomeStdcmV2() {
  return (
    <Routes>
      <Route path="" element={<StdcmViewV2 />} />
    </Routes>
  );
}
