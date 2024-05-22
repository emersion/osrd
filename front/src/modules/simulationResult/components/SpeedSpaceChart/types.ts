import type { PathProperties, SimulationResponse } from 'common/api/osrdEditoastApi';
import type { HeightPosition, RadiusPosition } from 'reducers/osrdsimulation/types';

export type ElectricalConditionSegmentV2 = {
  position_start: number;
  position_end: number;
  position_middle: number;
  lastPosition: number;
  height_start: number;
  height_end: number;
  height_middle: number;
  electrification: ElectrificationUsageV2;
  seenRestriction?: string;
  usedRestriction?: string;
  color: string;
  textColor: string;
  text: string;
  isStriped: boolean;
  isIncompatibleElectricalProfile: boolean;
  isRestriction: boolean;
  isIncompatiblePowerRestriction: boolean;
};

export type ReportTrainData = {
  position: number;
  speed: number;
  time: number;
};

export type MrspData = {
  position: number;
  speed: number;
};

export type AreaBlockV2 = {
  position: number;
  value0: number;
  value1: number;
};

export type BoundariesData = {
  /** List of `n` boundaries of the ranges.
        A boundary is a distance from the beginning of the path in mm. */
  boundaries: number[];
  /** List of `n+1` values associated to the ranges */
  values: number[];
};

export type ElectricalBoundariesData = {
  boundaries: number[];
  values: (ElectrificationValue | ElectricalProfileValue)[];
};

export type ElectricalRangesData<T = ElectrificationValue | ElectricalProfileValue> = {
  start: number;
  stop: number;
  values: T;
};

export type ElectrificationValue = NonNullable<
  PathProperties['electrifications']
>['values'][number];

export type ElectricalProfileValue = Extract<
  SimulationResponse,
  { status: 'success' }
>['electrical_profiles']['values'][number];

export type ElectrificationRangeV2 = {
  electrificationUsage: ElectrificationUsageV2;
  start: number;
  stop: number;
};

export type ElectrificationUsageV2 = ElectrificationValue & { profile: string | null };

export type SimulationPowerRestrictionRangeV2 = {
  code: string;
  start: number;
  stop: number;
};

export type PositionData = { [key: string]: number; position: number };

export type GevPreparedDataV2 = {
  areaBlock: AreaBlockV2[];
  areaSlopesHistogram: AreaBlockV2[];
  curvesHistogram: RadiusPosition[];
  electrificationRanges: ElectrificationRangeV2[];
  powerRestrictionRanges: SimulationPowerRestrictionRangeV2[];
  baseSpeedData: ReportTrainData[];
  standardMarginSpeedData: ReportTrainData[];
  schedulePointsMarginSpeedData: ReportTrainData[];
  mrspData: MrspData[];
  slopesCurve: HeightPosition[];
  slopesHistogram: PositionData[];
  pathLength: number;
};

export type Mode = {
  '25000V': AC | string;
  '1500V': DC | string;
  thermal: string;
  '15000V': string;
  '3000V': string;
};

export type AC = {
  '25000V': string;
  '22500V': string;
  '20000V': string;
};

export type DC = {
  O: string;
  A: string;
  A1: string;
  B: string;
  B1: string;
  C: string;
  D: string;
  E: string;
  F: string;
  G: string;
};
