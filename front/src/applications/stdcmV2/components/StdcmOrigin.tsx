import React from 'react';

import { useSelector } from 'react-redux';

import InputSNCF from 'common/BootstrapSNCF/InputSNCF';
import { useOsrdConfSelectors, useOsrdConfActions } from 'common/osrdContext';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';

import StdcmAllowances from './StdcmAllowances';
import StdcmCard from './StdcmCard';
import StdcmOperationalPoint from './StdcmOperationalPoint';

export default function StdcmOrigin() {
  const { getOriginV2 } = useOsrdConfSelectors();
  const { updateOriginV2 } = useOsrdConfActions() as StdcmConfSliceActions;
  const origin = useSelector(getOriginV2);
  return (
    <StdcmCard name="Origine" hasTip>
      <div className="stdcm-v2-origin">
        <StdcmOperationalPoint updatePoint={updateOriginV2} point={origin} />
        <div className="stdcm-v2-origin__parameters">
          <div>
            <InputSNCF id="dateOrigin" label="Date" type="date" name="dateOrigin" />
          </div>
          <div>
            <InputSNCF type="time" label="Heure" id="originTime" />
          </div>
          <StdcmAllowances />
        </div>
      </div>
    </StdcmCard>
  );
}
