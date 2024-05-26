import { isNaN } from 'lodash';

import type { TrainScheduleBase } from 'common/api/osrdEditoastApi';
import type { PathStep } from 'reducers/osrdconf/types';
import { formatDurationAsISO8601 } from 'utils/timeManipulation';

const formatSchedule = (pathSteps: PathStep[]): TrainScheduleBase['schedule'] =>
  pathSteps.map((step) => ({
    at: step.id,
    arrival: step.arrival,
    locked: step.locked,
    on_stop_signal: step.onStopSignal,
    stop_for: isNaN(Number(step.stop_for))
      ? undefined
      : formatDurationAsISO8601(Number(step.stop_for)),
  }));

export default formatSchedule;
