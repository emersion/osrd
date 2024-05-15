import React from 'react';

import { Input } from '@osrd-project/ui-core';

import SpeedLimitByTagSelector from 'common/SpeedLimitByTagSelector/SpeedLimitByTagSelector';
import { useStoreDataForSpeedLimitByTagSelector } from 'common/SpeedLimitByTagSelector/useStoreDataForSpeedLimitByTagSelector';

import StdcmCard from './StdcmCard';

export default function StdcmConsist() {
  const { speedLimitByTag, speedLimitsByTags, dispatchUpdateSpeedLimitByTag } =
    useStoreDataForSpeedLimitByTagSelector();

  return (
    <StdcmCard name="Convoi">
      <div className="stdcm-v2-consist">
        <div>
          <Input id="tractionEngine" label="Engin de traction" />
        </div>
        <div className="stdcm-v2-consist__properties">
          <Input id="tonnage" label="Tonnage" trailingContent="t" />
          <Input id="Longueur" label="longueur" trailingContent="m" />
        </div>
        <SpeedLimitByTagSelector
          selectedSpeedLimitByTag={speedLimitByTag}
          speedLimitsByTags={speedLimitsByTags}
          dispatchUpdateSpeedLimitByTag={dispatchUpdateSpeedLimitByTag}
        />
      </div>
    </StdcmCard>
  );
}
