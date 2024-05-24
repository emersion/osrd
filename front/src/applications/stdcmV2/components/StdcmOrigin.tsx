import React from 'react';

import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import InputSNCF from 'common/BootstrapSNCF/InputSNCF';
import { useOsrdConfSelectors, useOsrdConfActions } from 'common/osrdContext';
import StdcmAllowances from 'modules/stdcmAllowances/components/StdcmAllowances';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';
import { useAppDispatch } from 'store';

import StdcmCard from './StdcmCard';
import StdcmOperationalPoint from './StdcmOperationalPoint';

const StdcmOrigin = ({ isPending = false }: { isPending?: boolean }) => {
  const { t } = useTranslation('stdcm');
  const { getOriginV2, getOriginDate, getOriginTime } = useOsrdConfSelectors();
  const { updateOriginV2, updateOriginDate, updateOriginTime } =
    useOsrdConfActions() as StdcmConfSliceActions;
  const origin = useSelector(getOriginV2);
  const originDate = useSelector(getOriginDate);
  const originTime = useSelector(getOriginTime);
  const dispatch = useAppDispatch();
  return (
    <StdcmCard name={t('trainPath.origin')} disabled={isPending} hasTip>
      <div className="stdcm-v2-origin">
        <StdcmOperationalPoint updatePoint={updateOriginV2} point={origin} isPending={isPending} />
        <div className="stdcm-v2-origin__parameters d-flex">
          <div className="col-6">
            <InputSNCF
              id="dateOrigin"
              label={t('trainPath.date')}
              type="date"
              name="dateOrigin"
              onChange={(e) => dispatch(updateOriginDate(e.target.value))}
              value={originDate}
              disabled={isPending}
            />
          </div>
          <div className="col-6">
            <InputSNCF
              type="time"
              label={t('trainPath.time')}
              id="originTime"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                dispatch(updateOriginTime(e.target.value))
              }
              value={originTime}
              disabled={isPending}
            />
          </div>
        </div>
        <StdcmAllowances disabled={isPending} />
      </div>
    </StdcmCard>
  );
};

export default StdcmOrigin;
