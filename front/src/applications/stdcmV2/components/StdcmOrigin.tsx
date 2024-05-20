import React from 'react';

import { useSelector } from 'react-redux';

import InputSNCF from 'common/BootstrapSNCF/InputSNCF';
import { useOsrdConfSelectors, useOsrdConfActions } from 'common/osrdContext';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';
import { useAppDispatch } from 'store';

import StdcmAllowances from './StdcmAllowances';
import StdcmCard from './StdcmCard';
import StdcmOperationalPoint from './StdcmOperationalPoint';

export default function StdcmOrigin() {
  const { getOriginV2, getOriginDate, getOriginTime } = useOsrdConfSelectors();
  const { updateOriginV2, updateOriginDate, updateOriginTime } =
    useOsrdConfActions() as StdcmConfSliceActions;
  const origin = useSelector(getOriginV2);
  const originDate = useSelector(getOriginDate);
  const originTime = useSelector(getOriginTime);
  const dispatch = useAppDispatch();
  return (
    <StdcmCard name="Origine" hasTip>
      <div className="stdcm-v2-origin">
        <StdcmOperationalPoint updatePoint={updateOriginV2} point={origin} />
        <div className="stdcm-v2-origin__parameters d-flex">
          <div className="col-4">
            <InputSNCF
              id="dateOrigin"
              label="Date"
              type="date"
              name="dateOrigin"
              onChange={(e) => dispatch(updateOriginDate(e.target.value))}
              value={originDate}
            />
          </div>
          <div className="col-4">
            <InputSNCF
              type="time"
              label="Heure"
              id="originTime"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                dispatch(updateOriginTime(e.target.value))
              }
              value={originTime}
            />
          </div>
          <div className="col-4">
            <StdcmAllowances />
          </div>
        </div>
      </div>
    </StdcmCard>
  );
}
