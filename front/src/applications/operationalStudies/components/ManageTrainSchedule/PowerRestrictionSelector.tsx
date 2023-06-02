import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updatePowerRestriction } from 'reducers/osrdconf';
import icon from 'assets/pictures/components/power_restrictions.svg';
import SelectImprovedSNCF from 'common/BootstrapSNCF/SelectImprovedSNCF';
import {
  getRollingStockID,
  getPowerRestriction,
  getPathfindingID,
} from 'reducers/osrdconf/selectors';
import { osrdEditoastApi, RollingStock } from 'common/api/osrdEditoastApi';
import { lengthFromLineCoordinates } from 'utils/geometry';
import { setWarning } from 'reducers/main';
import { compact, isEmpty, reduce, uniq } from 'lodash';
import { PowerRestrictionRange } from 'common/api/osrdMiddlewareApi';

type selectorOption = { key: string | undefined; value: string | undefined };

type ElectrificationPR = {
  [key: string]: string[] | string[];
};

export default function PowerRestrictionSelector() {
  const { t } = useTranslation(['operationalStudies/manageTrainSchedule']);
  const dispatch = useDispatch();
  const rollingStockID: number | undefined = useSelector(getRollingStockID);
  const pathFindingID = useSelector(getPathfindingID);
  const powerRestriction = useSelector(getPowerRestriction);

  const { data: pathFinding } = osrdEditoastApi.useGetPathfindingByIdQuery(
    { id: pathFindingID as number },
    { skip: !pathFindingID }
  );

  const { data: pathWithCatenaries } = osrdEditoastApi.useGetPathfindingByPathIdCatenariesQuery(
    { pathId: pathFindingID as number },
    { skip: !pathFindingID }
  );

  const { data: rollingStock } = osrdEditoastApi.useGetRollingStockByIdQuery(
    { id: rollingStockID as number },
    { skip: !rollingStockID }
  );

  const powerRestrictions = useMemo(
    () =>
      rollingStock && !isEmpty(rollingStock.power_restrictions)
        ? [t('noPowerRestriction'), ...Object.keys(rollingStock.power_restrictions)]
        : [],
    [rollingStock?.power_restrictions]
  );

  // Extract unique rollingstock's power restriction codes allowed by each electrification mode
  const cleanConditionalEffortCurves = (rollingStockToClean: RollingStock) => {
    const curvesMode = rollingStockToClean.effort_curves.modes;
    const curvesModesKey = Object.keys(curvesMode);

    const parsedElectrification: ElectrificationPR = reduce(
      curvesModesKey,
      (result, mode) => {
        const powerCodes = curvesMode[mode].curves.map(
          (curve) => curve.cond?.power_restriction_code
        );
        compact(uniq(powerCodes));
        return {
          ...result,
          [mode]: powerCodes,
        };
      },
      {}
    );

    return parsedElectrification;
  };

  const definePowerRestrictionRange = async (powerRestrictionCode?: string) => {
    if (powerRestrictionCode && pathFinding) {
      const pathLength = Math.round(
        lengthFromLineCoordinates(pathFinding.geographic?.coordinates) * 1000
      );
      const powerRestrictionRange: PowerRestrictionRange[] = [
        {
          begin_position: 0,
          end_position: pathLength,
          power_restriction_code: powerRestrictionCode,
        },
      ];

      dispatch(updatePowerRestriction(powerRestrictionRange));
    } else dispatch(updatePowerRestriction(undefined));
  };

  useEffect(() => {
    if (powerRestriction && rollingStock && pathWithCatenaries) {
      const parsedElectrification = cleanConditionalEffortCurves(rollingStock);

      const powerRestrictionCode = powerRestriction[0].power_restriction_code;
      const pathCatenaryRanges = pathWithCatenaries.catenary_ranges;

      if (pathCatenaryRanges && powerRestrictionCode) {
        // Extract path electrification mode and check compatibility
        const pathElectrification = compact(pathCatenaryRanges.map((range) => range.mode));

        // Display an error when the first incompatibility is encountered
        pathElectrification.some((electrification) => {
          const isInvalid =
            !parsedElectrification[electrification as keyof ElectrificationPR].includes(
              powerRestrictionCode
            );
          if (isInvalid) {
            dispatch(
              setWarning({
                title: t('warningMessages.electrification'),
                text: t('warningMessages.powerRestrictionInvalidCombination', {
                  powerRestrictionCode,
                  electrification,
                }),
              })
            );
          }

          return isInvalid;
        });
      }
    }
  }, [powerRestriction]);

  return powerRestrictions.length > 0 && pathFindingID ? (
    <div className="osrd-config-item mb-2">
      <div className="osrd-config-item-container">
        <img width="32px" className="mr-2" src={icon} alt="PowerRestrictionIcon" />
        <span className="text-muted">{t('powerRestriction')}</span>
        <SelectImprovedSNCF
          sm
          options={powerRestrictions}
          onChange={(e: selectorOption) => definePowerRestrictionRange(e.key)}
          selectedValue={
            (powerRestriction &&
              powerRestriction[0] &&
              powerRestriction[0].power_restriction_code) ||
            t('noPowerRestriction')
          }
        />
      </div>
    </div>
  ) : null;
}
