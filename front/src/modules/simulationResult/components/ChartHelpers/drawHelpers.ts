import type {
  ElectricalConditionSegment,
  PowerRestrictionSegment,
  DrawingKeys,
} from 'applications/operationalStudies/consts';
import type { ElectricalConditionSegmentV2 } from 'modules/simulationResult/components/SpeedSpaceChart/types';

/** Returns the start, middle and end values of the heights or the positions
 * (depending on the axis and rotation) of a given segment. */
const getAxisValues = (
  segment: ElectricalConditionSegment | PowerRestrictionSegment,
  keyValues: DrawingKeys,
  keyIndex: number
) => ({
  start: segment[`${keyValues[keyIndex]}_start`],
  middle: segment[`${keyValues[keyIndex]}_middle`],
  end: segment[`${keyValues[keyIndex]}_end`],
});

/** Returns the start, middle and end values of the heights or the positions
 * (depending on the axis and rotation) of a given segment. */
export const getAxisValuesV2 = (
  segment: ElectricalConditionSegmentV2 | PowerRestrictionSegment,
  keyValues: DrawingKeys,
  keyIndex: number
) => ({
  start: segment[`${keyValues[keyIndex]}_start`],
  middle: segment[`${keyValues[keyIndex]}_middle`],
  end: segment[`${keyValues[keyIndex]}_end`],
});

export default getAxisValues;
