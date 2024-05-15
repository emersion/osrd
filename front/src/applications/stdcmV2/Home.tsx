import React from 'react';

import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';

import NavBarSNCF from 'common/BootstrapSNCF/NavBarSNCF';

import OSRDSTDCM from './views/OSRDSTDCM';

export default function HomeStdcmV2() {
  const { t } = useTranslation('home/home');
  return (
    <>
      {/* <NavBarSNCF appName={t('stdcm')} /> */}
      <Routes>
        <Route path="" element={<OSRDSTDCM />} />
      </Routes>
    </>
  );
}
