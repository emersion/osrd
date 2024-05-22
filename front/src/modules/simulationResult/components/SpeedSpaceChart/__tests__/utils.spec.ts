import { formatElectrificationRanges } from 'modules/simulationResult/components/SpeedSpaceChart/utils';

import {
  formattedElectrificationRanges,
  sampleElectrificalProfiles,
  sampleElectrifications,
} from './sampleData';

describe('formatElectrificationRanges', () => {
  it('should return formatted electrification ranges', () => {
    const electrificationRanges = formatElectrificationRanges(
      sampleElectrifications,
      sampleElectrificalProfiles
    );
    expect(electrificationRanges).toStrictEqual(formattedElectrificationRanges);
  });
});
