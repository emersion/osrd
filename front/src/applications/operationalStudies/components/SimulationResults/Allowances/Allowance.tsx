import React from 'react';
import { TFunction } from 'react-i18next';
import { identity, isNumber } from 'lodash';

import { FaTrash } from 'react-icons/fa';

import { Allowance, RangeAllowance } from 'common/api/osrdMiddlewareApi';
import { OsrdSimulationState } from 'reducers/osrdsimulation/types';
import { ALLOWANCE_UNITS_KEYS } from './allowancesConsts';

interface AllowanceProps<T> {
  data: T;
  distribution?: 'MARECO' | 'LINEAR';
  allowanceType?: Allowance['allowance_type'];
  delAllowance: (idx: number, allowanceType?: Allowance['allowance_type']) => void;
  idx: number;
  t: TFunction;
  selectedTrain: OsrdSimulationState['selectedTrain'];
  simulation: OsrdSimulationState['simulation']['present'];
}

function Allowance<T extends RangeAllowance>({
  data: { begin_position, end_position, value } = {} as T,
  distribution,
  allowanceType,
  delAllowance,
  idx,
  selectedTrain,
  simulation,
  t = identity,
}: AllowanceProps<T>) {
  const position2name = (position?: number) => {
    if (!isNumber(position)) {
      return '-';
    }
    const place = simulation.trains[selectedTrain].base.stops.find(
      (element) => element.position === position
    );
    return place && place.name !== null
      ? `${place.name} (${Math.round(position)}m)`
      : `${position}m`;
  };

  return (
    <div className="allowance-line">
      <div className="row align-items-center">
        <div className="col-md-1">
          <small>{idx + 1}</small>
        </div>
        <div className="col-md-2 text-left">{position2name(begin_position)}</div>
        <div className="col-md-3 text-center">{position2name(end_position)}</div>
        <div className="col-md-2 text-left">
          {t(`distributions.${distribution?.toLowerCase()}`)}
        </div>
        <div className="col-md-3 text-left">
          {t(`allowanceTypes.${value?.value_type}`)}{' '}
          {value && ALLOWANCE_UNITS_KEYS[value.value_type]}
        </div>
        <div className="col-md-1 d-flex align-items-right">
          <button
            type="button"
            className="btn btn-sm btn-only-icon btn-white text-danger"
            onClick={() => delAllowance(idx, allowanceType)}
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Allowance;
