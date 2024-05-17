import React from 'react';

import { useSelector } from 'react-redux';

import { useOsrdConfSelectors, useOsrdConfActions } from 'common/osrdContext';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';

import StdcmCard from './StdcmCard';
import StdcmOperationalPoint from './StdcmOperationalPoint';

export default function StdcmDestination() {
  const { getDestinationV2 } = useOsrdConfSelectors();
  const { updateDestinationV2 } = useOsrdConfActions() as StdcmConfSliceActions;
  const destination = useSelector(getDestinationV2);
  return (
    <StdcmCard name="Destination">
      <div className="stdcm-v2-destination">
        <StdcmOperationalPoint updatePoint={updateDestinationV2} point={destination} />
        <div>
          {/* <Select
          id="destination"
          label="Destination"
          options={[
            { value: 'a', label: 'dès que possible' },
            { value: 'b', label: 'B' },
            { value: 'c', label: 'C' },
          ]}
        /> */}
          <select id="destination" name="destination">
            <option value="a">dès que possible</option>
            <option value="b">B</option>
            <option value="c">C</option>
          </select>
        </div>
      </div>
    </StdcmCard>
  );
}
