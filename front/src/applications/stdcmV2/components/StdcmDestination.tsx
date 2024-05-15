import React from 'react';

import StdcmCard from './StdcmCard';
import StdcmOperationalPoint from './StdcmOperationalPoint';

export default function StdcmDestination() {
  return (
    <StdcmCard name="Destination">
      <div className="stdcm-v2-destination">
        <StdcmOperationalPoint />
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
