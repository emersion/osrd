import React from 'react';

import InputSNCF from 'common/BootstrapSNCF/InputSNCF';

import StdcmAllowances from './StdcmAllowances';
import StdcmCard from './StdcmCard';
import StdcmOperationalPoint from './StdcmOperationalPoint';

export default function StdcmOrigin() {
  return (
    <StdcmCard name="Origine" hasTip>
      <div className="stdcm-v2-origin">
        <StdcmOperationalPoint />
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
