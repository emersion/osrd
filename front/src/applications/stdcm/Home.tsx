import React from 'react';

import { useSelector } from 'react-redux';

import HomeStdcmV2 from 'applications/stdcmV2/HomeV2';
import { getSTDCMV2Activated } from 'reducers/user/userSelectors';

import HomeStdcmV1 from './HomeV1';

export default function HomeStdcm() {
  const STDCMV2Activated = useSelector(getSTDCMV2Activated);

  return STDCMV2Activated ? <HomeStdcmV2 /> : <HomeStdcmV1 />;
}
