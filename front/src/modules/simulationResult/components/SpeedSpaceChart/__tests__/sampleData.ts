import type {
  ElectricalProfileValue,
  ElectricalRangesData,
  ElectrificationRangeV2,
  ElectrificationValue,
} from 'modules/simulationResult/components/SpeedSpaceChart/types';

export const sampleElectrifications: ElectricalRangesData<ElectrificationValue>[] = [
  {
    start: 0,
    stop: 100,
    values: {
      type: 'electrification',
      voltage: '1500V',
    },
  },
  {
    start: 100,
    stop: 150,
    values: {
      type: 'neutral_section',
      lower_pantograph: false,
    },
  },
  {
    start: 150,
    stop: 200,
    values: {
      type: 'non_electrified',
    },
  },
  {
    start: 200,
    stop: 300,
    values: {
      type: 'electrification',
      voltage: '25000V',
    },
  },
  {
    start: 300,
    stop: 350,
    values: {
      type: 'neutral_section',
      lower_pantograph: false,
    },
  },
  {
    start: 350,
    stop: 375,
    values: {
      type: 'neutral_section',
      lower_pantograph: true,
    },
  },
  {
    start: 375,
    stop: 400,
    values: {
      type: 'electrification',
      voltage: '25000V',
    },
  },
];

export const sampleElectrificalProfiles: ElectricalRangesData<ElectricalProfileValue>[] = [
  {
    start: 0,
    stop: 100,
    values: { electrical_profile_type: 'profile', profile: 'A1' },
  },
  {
    start: 100,
    stop: 200,
    values: { electrical_profile_type: 'no_profile' },
  },
  {
    start: 200,
    stop: 300,
    values: { electrical_profile_type: 'profile', profile: '25000V' },
  },
  {
    start: 300,
    stop: 375,
    values: { electrical_profile_type: 'no_profile' },
  },
  {
    start: 375,
    stop: 400,
    values: { electrical_profile_type: 'profile', profile: '20000V' },
  },
];

export const formattedElectrificationRanges: ElectrificationRangeV2[] = [
  {
    start: 0,
    stop: 100,
    electrificationUsage: {
      type: 'electrification',
      voltage: '1500V',
      profile: 'A1',
    },
  },
  {
    start: 100,
    stop: 150,
    electrificationUsage: {
      type: 'neutral_section',
      lower_pantograph: false,
      profile: null,
    },
  },
  {
    start: 150,
    stop: 200,
    electrificationUsage: {
      type: 'non_electrified',
      profile: null,
    },
  },
  {
    start: 200,
    stop: 300,
    electrificationUsage: {
      type: 'electrification',
      voltage: '25000V',
      profile: '25000V',
    },
  },
  {
    start: 300,
    stop: 350,
    electrificationUsage: {
      type: 'neutral_section',
      lower_pantograph: false,
      profile: null,
    },
  },
  {
    start: 350,
    stop: 375,
    electrificationUsage: {
      type: 'neutral_section',
      lower_pantograph: true,
      profile: null,
    },
  },
  {
    start: 375,
    stop: 400,
    electrificationUsage: {
      type: 'electrification',
      voltage: '25000V',
      profile: '20000V',
    },
  },
];
