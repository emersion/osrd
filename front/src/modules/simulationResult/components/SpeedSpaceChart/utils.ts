import * as d3 from 'd3';

import type {
  GradientPosition,
  HeightPosition,
  RadiusPosition,
} from 'reducers/osrdsimulation/types';

import {
  electricalProfileColorsWithProfile,
  electricalProfileColorsWithoutProfile,
} from './consts';
import type {
  AC,
  BoundariesData,
  DC,
  ElectricalBoundariesData,
  ElectricalConditionSegmentV2,
  ElectricalProfileValue,
  ElectricalRangesData,
  ElectrificationRangeV2,
  ElectrificationValue,
  PositionData,
  SimulationPowerRestrictionRangeV2,
} from './types';

const calculateReferentialHeight = (data: number[]) => {
  const maxRef = d3.max(data);
  const minRef = d3.min(data);
  let refHeight = 0;
  if (maxRef !== undefined && minRef !== undefined) {
    refHeight = maxRef - minRef;
  }
  return refHeight;
};

export const createCurveCurve = (curves: RadiusPosition[], data: number[]): RadiusPosition[] => {
  const referentialHeight = calculateReferentialHeight(data);
  const maxRadius = d3.max(curves.map((step) => step.radius));
  const minRadius = d3.min(curves.map((step) => step.radius));
  let dataHeight = 0;
  if (maxRadius !== undefined && minRadius !== undefined) {
    dataHeight = maxRadius - minRadius;
  }
  return curves.map((step) => ({
    ...step,
    radius: step.radius > 0 ? (step.radius * referentialHeight) / dataHeight : 0,
  }));
};

export const createSlopeCurve = (slopes: GradientPosition[], data: number[]): HeightPosition[] => {
  const slopesCurve: HeightPosition[] = [];
  slopes.forEach((step, idx) => {
    if (idx % 2 === 0 && slopes[idx + 1]) {
      if (idx === 0) {
        slopesCurve.push({ height: 0, position: step.position });
      } else {
        const distance = step.position - slopesCurve[slopesCurve.length - 1].position;
        const height =
          (distance * slopes[idx - 2].gradient) / 1000 + slopesCurve[slopesCurve.length - 1].height;
        slopesCurve.push({ height, position: step.position });
      }
    }
  });
  const referentialHeight = calculateReferentialHeight(data);
  const maxRadius = d3.max(slopesCurve.map((step) => step.height));
  const minRadius = d3.min(slopesCurve.map((step) => step.height));
  let dataHeight = 0;
  if (maxRadius !== undefined && minRadius !== undefined) {
    dataHeight = maxRadius - minRadius;
  }
  return slopesCurve.map((step) => ({
    ...step,
    height: (step.height * referentialHeight) / dataHeight,
  }));
};

/**
 * Transform datas received with boundaries / values format :
 *  - boundaries : List of `n` boundaries of the ranges. A boundary is a distance 
 * from the beginning of the path in mm. 
    - values : List of `n+1` values associated to the ranges.
    @returns an array of PositionData with the position in meters and the associated value
    depending on the kind of data provided. As the boundaries don't include the path's origin and destination
    positions, we add them manually.
 */
export const transformBoundariesDataToPositionDataArray = (
  boundariesData: BoundariesData,
  pathLength: number,
  value: 'gradient' | 'radius' | 'electrificationUsage'
): PositionData[] => {
  const formatedData = boundariesData.boundaries.reduce(
    (acc: PositionData[], boundary, index) => {
      acc.push({
        position: boundary / 1000, // need to be in meters
        [value]: boundariesData.values[index],
      });
      return acc;
    },
    [{ position: 0, [value]: 0 }]
  );

  formatedData.push({
    position: pathLength / 1000, // need to be in meters
    [value]: boundariesData.values[boundariesData.values.length - 1],
  });

  return formatedData;
};

/**
 * Transform electrifications received with boundaries / values format :
 *  - boundaries : List of `n` boundaries of the ranges. A boundary is a distance 
 * from the beginning of the path in mm. 
    - values : List of `n+1` values associated to the ranges.
    @returns an array of electrifications ranges with the start and stop of the range in meters and 
    the associated value. As the boundaries don't include the path's origin and destination
    positions, we add them manually.
 */
export const transformBoundariesDataToRangesData = (
  boundariesData: ElectricalBoundariesData,
  pathLength: number
): ElectricalRangesData[] => {
  const formatedData = boundariesData.boundaries.map((boundary, index) => ({
    start: index === 0 ? 0 : boundariesData.boundaries[index - 1] / 1000, // need to be in meters
    stop: boundary / 1000, // need to be in meters
    values: boundariesData.values[index],
  }));

  formatedData.push({
    start: boundariesData.boundaries[boundariesData.boundaries.length - 1] / 1000, // need to be in meters,
    stop: pathLength / 1000, // need to be in meters
    values: boundariesData.values[boundariesData.values.length - 1],
  });

  return formatedData;
};

export const formatElectrificationRanges = (
  electrifications: ElectricalRangesData<ElectrificationValue>[],
  electricalProfiles: ElectricalRangesData<ElectricalProfileValue>[]
): ElectrificationRangeV2[] =>
  // Electrifications can be of three types, electricalProfiles only two, so we know electrifications
  // will always be at least as long as electricalProfiles so we can use it as the main array
  electrifications.reduce((acc: ElectrificationRangeV2[], curr, index) => {
    const currentElectrification = curr;
    const currentProfile = electricalProfiles[index];

    // currentProfile is defined as long as we didn't reach the end of electricalProfiles array
    if (currentProfile) {
      // If start and stop are identical, we can merge the two items
      if (
        currentElectrification.start === currentProfile.start &&
        currentElectrification.stop === currentProfile.stop
      ) {
        acc.push({
          electrificationUsage: {
            ...currentElectrification.values,
            profile:
              currentProfile.values.electrical_profile_type === 'profile'
                ? currentProfile.values.profile
                : null,
          },
          start: currentElectrification.start,
          stop: currentElectrification.stop,
        });
      } else {
        // Find the profile matching the current electrification range
        // We know we will find one because currentProfile is still defined
        const associatedProfile = electricalProfiles.find(
          (profile) => profile.stop >= currentElectrification.stop
        ) as ElectricalRangesData<ElectricalProfileValue>;

        acc.push({
          electrificationUsage: {
            ...currentElectrification.values,
            profile:
              associatedProfile.values.electrical_profile_type === 'profile'
                ? associatedProfile.values.profile
                : null,
          },
          start: currentElectrification.start,
          stop: currentElectrification.stop,
        });
      }
      // If we reached the end of the electricalProfiles array, we use its last value for the profile
    } else {
      // Find the profile matching the current electrification range
      // We know we will find one because theirs last stops are the same
      const associatedProfile = electricalProfiles.find(
        (profile) => profile.stop >= currentElectrification.stop
      ) as ElectricalRangesData<ElectricalProfileValue>;

      acc.push({
        electrificationUsage: {
          ...currentElectrification.values,
          profile:
            associatedProfile.values.electrical_profile_type === 'profile'
              ? associatedProfile.values.profile
              : null,
        },
        start: currentElectrification.start,
        stop: currentElectrification.stop,
      });
    }

    return acc;
  }, []);

/**
 * Create the altitude curve based from the slopes data
 */
export const createSlopeCurveV2 = (
  slopes: PositionData[],
  baseSpeeds: number[]
): HeightPosition[] => {
  const slopesCurve: HeightPosition[] = [];
  slopes.forEach((step, idx) => {
    if (idx % 2 === 0 && slopes[idx + 1]) {
      if (idx === 0) {
        slopesCurve.push({ height: 0, position: step.position });
      } else {
        const distance = step.position - slopesCurve[slopesCurve.length - 1].position;
        const height =
          (distance * slopes[idx - 2].gradient) / 1000 + slopesCurve[slopesCurve.length - 1].height;
        slopesCurve.push({ height, position: step.position });
      }
    }
  });
  const referentialHeight = calculateReferentialHeight(baseSpeeds);
  const maxRadius = d3.max(slopesCurve.map((step) => step.height));
  const minRadius = d3.min(slopesCurve.map((step) => step.height));
  let dataHeight = 0;
  if (maxRadius !== undefined && minRadius !== undefined) {
    dataHeight = maxRadius - minRadius;
  }
  return slopesCurve.map((step) => ({
    ...step,
    height: (step.height * referentialHeight) / dataHeight,
  }));
};

export const createCurvesCurveV2 = (
  curves: PositionData[],
  baseSpeeds: number[]
): RadiusPosition[] => {
  const referentialHeight = calculateReferentialHeight(baseSpeeds);
  const maxRadius = d3.max(curves.map((step) => step.radius));
  const minRadius = d3.min(curves.map((step) => step.radius));
  let dataHeight = 0;
  if (maxRadius !== undefined && minRadius !== undefined) {
    dataHeight = maxRadius - minRadius;
  }
  return curves.map((step) => ({
    position: step.position,
    radius: step.radius > 0 ? (step.radius * referentialHeight) / dataHeight : 0,
  }));
};

export const createProfileSegmentV2 = (
  fullElectrificationRange: ElectrificationRangeV2[],
  electrificationRange: ElectrificationRangeV2
) => {
  const electrification = electrificationRange.electrificationUsage;
  const segment: ElectricalConditionSegmentV2 = {
    position_start: electrificationRange.start,
    position_end: electrificationRange.stop,
    position_middle: (electrificationRange.start + electrificationRange.stop) / 2,
    lastPosition: fullElectrificationRange.slice(-1)[0].stop,
    height_start: 4,
    height_end: 24,
    height_middle: 14,
    electrification,
    color: '',
    textColor: '',
    text: '',
    isStriped: false,
    isIncompatibleElectricalProfile: false,
    isRestriction: false,
    isIncompatiblePowerRestriction: false,
  };

  // TODO TS2 : Handle all electrical profiles logic when we know where to find them

  // add colors to object depending of the type of electrification
  if (electrification.type === 'electrification') {
    // const { mode, mode_handled, profile, profile_handled } = electrification;
    const { voltage, profile } = electrification;

    // if (profile) {
    //   segment.color =
    //     electricalProfileColorsWithProfile[
    //       voltage as keyof typeof electricalProfileColorsWithProfile
    //     ][profile as string | keyof AC | keyof DC];
    // } else {
    //   segment.color =
    //     electricalProfileColorsWithoutProfile[
    //       voltage as keyof typeof electricalProfileColorsWithoutProfile
    //     ];
    // }
    segment.color =
      electricalProfileColorsWithoutProfile[
        voltage as keyof typeof electricalProfileColorsWithoutProfile
      ];

    segment.textColor =
      electricalProfileColorsWithoutProfile[
        voltage as keyof typeof electricalProfileColorsWithoutProfile
      ];

    // if (!mode_handled) {
    //   // uncompatible mode
    //   segment.text = `${i18n.t('electricalProfiles.incompatibleMode', { ns: 'simulation' })}`;
    // } else
    if (voltage !== 'thermal') {
      // compatible electric mode (themal modes are not displayed)
      // if (profile) {
      //   if (profile_handled) {
      //     // compatible electric mode, with compatible profile
      //     segment.text = `${voltage} ${profile}`;
      //   } else {
      //     // compatible electric mode, with uncompatible profile
      //     segment.isIncompatibleElectricalProfile = true;
      //     segment.isStriped = true;
      //     segment.text = `${voltage}, ${i18n.t('electricalProfiles.incompatibleProfile', {
      //       ns: 'simulation',
      //     })}`;
      //   }
      // } else {
      // compatible electric mode, but missing profile
      segment.text = voltage;
      segment.isStriped = true;
      // }
    }
  } else if (electrification.type === 'neutral_section') {
    segment.text = 'Neutral';
    segment.color = '#000000';
    segment.textColor = '#000000';
  } else {
    segment.text = 'NonElectrified';
    segment.color = '#000000';
    segment.textColor = '#000';
  }

  return segment;
};

export const createPowerRestrictionSegmentV2 = (
  fullPowerRestrictionRange: SimulationPowerRestrictionRangeV2[],
  powerRestrictionRange: SimulationPowerRestrictionRangeV2
) => {
  // figure out if the power restriction is incompatible or missing
  const isRestriction = powerRestrictionRange.handled;
  const isIncompatiblePowerRestriction =
    !!powerRestrictionRange.code && !powerRestrictionRange.handled;
  const isStriped = !!powerRestrictionRange.code && !powerRestrictionRange.handled;

  const segment: PowerRestrictionSegment = {
    position_start: powerRestrictionRange.start,
    position_end: powerRestrictionRange.stop,
    position_middle: (powerRestrictionRange.start + powerRestrictionRange.stop) / 2,
    lastPosition: fullPowerRestrictionRange.slice(-1)[0].stop,
    height_start: 4,
    height_end: 24,
    height_middle: 14,
    seenRestriction: powerRestrictionRange.code || '',
    usedRestriction: powerRestrictionRange.handled,
    isStriped,
    isRestriction,
    isIncompatiblePowerRestriction,
  };

  return segment;
};
