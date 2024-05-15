import React from 'react';

import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import InputSNCF from 'common/BootstrapSNCF/InputSNCF';
import { useOsrdConfSelectors, useOsrdConfActions } from 'common/osrdContext';
import { ALLOWANCE_UNITS_KEYS } from 'modules/stdcmAllowances/allowancesConsts';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';
import type { StdcmConfSelectors } from 'reducers/osrdconf/stdcmConf/selectors';
import { useAppDispatch } from 'store';
import { convertInputStringToNumber } from 'utils/strings';

const StdcmAllowances = () => {
  const { t } = useTranslation('allowances');
  const dispatch = useAppDispatch();
  const { getGridMarginBefore, getGridMarginAfter } = useOsrdConfSelectors() as StdcmConfSelectors;
  const { updateGridMarginAfter, updateGridMarginBefore } =
    useOsrdConfActions() as StdcmConfSliceActions;
  const gridMarginBefore = useSelector(getGridMarginBefore);
  const gridMarginAfter = useSelector(getGridMarginAfter);

  return (
    <div className="d-flex mb-2 osrd-config-item-container px-0">
      <div className="col-3">
        <InputSNCF
          id="standardAllowanceTypeGridMarginBefore"
          type="number"
          value={gridMarginBefore || ''}
          unit={ALLOWANCE_UNITS_KEYS.time}
          onChange={(e) =>
            dispatch(updateGridMarginBefore(Math.abs(convertInputStringToNumber(e.target.value))))
          }
          sm
          noMargin
          label={t('allowances:gridMarginBeforeAfter')}
          textRight
        />
      </div>
      <div className="col-3">
        <InputSNCF
          id="standardAllowanceTypeGridMarginAfter"
          type="number"
          value={gridMarginAfter || ''}
          unit={ALLOWANCE_UNITS_KEYS.time}
          onChange={(e) =>
            dispatch(updateGridMarginAfter(Math.abs(convertInputStringToNumber(e.target.value))))
          }
          sm
          noMargin
          label=" "
          textRight
        />
      </div>
    </div>
  );
};

export default StdcmAllowances;
