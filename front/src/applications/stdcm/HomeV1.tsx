import React from 'react';

import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';

import NavBarSNCF from 'common/BootstrapSNCF/NavBarSNCF';

import StdcmViewV1 from './views/StdcmViewV1';

export default function HomeStdcmV1() {
  const { t } = useTranslation('home/home');
  return (
    <>
      <NavBarSNCF appName={t('stdcm')} />
      <Routes>
        <Route path="" element={<StdcmViewV1 />} />
      </Routes>
    </>
  );
}
