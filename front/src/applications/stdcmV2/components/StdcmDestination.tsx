import React from 'react';

import { useSelector } from 'react-redux';

import { useOsrdConfSelectors, useOsrdConfActions } from 'common/osrdContext';
import type { StdcmConfSliceActions } from 'reducers/osrdconf/stdcmConf';

import StdcmCard from './StdcmCard';
import StdcmOperationalPoint from './StdcmOperationalPoint';

const StdcmDestination = ({ isPending = false }: { isPending?: boolean }) => {
  const { getDestinationV2 } = useOsrdConfSelectors();
  const { updateDestinationV2 } = useOsrdConfActions() as StdcmConfSliceActions;
  const destination = useSelector(getDestinationV2);
  return (
    <StdcmCard name="Destination" disabled={isPending}>
      <div className="stdcm-v2-destination">
        <StdcmOperationalPoint
          updatePoint={updateDestinationV2}
          point={destination}
          isPending={isPending}
        />
        <div>
          <select id="destination" name="destination" disabled>
            <option value="asSoonAsPossible">dès que possible</option>
          </select>
        </div>
      </div>
    </StdcmCard>
  );
};

export default StdcmDestination;
