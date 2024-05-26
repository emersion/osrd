import { findLastIndex } from 'lodash';

import type { Margin } from 'modules/trainschedule/components/ManageTrainSchedule/types';
import type { PathStep } from 'reducers/osrdconf/types';

const formatMargin = (pathSteps: (PathStep | null)[]): Margin => {
  const margin: Margin = {
    boundaries: [],
    values: [],
  };

  pathSteps.forEach((step, index) => {
    if (!step) return;
    if (index !== 0 && index !== findLastIndex(pathSteps)) {
      margin.boundaries.push(step.id);
    }
    if (index !== findLastIndex(pathSteps)) {
      margin.values.push(step.theoreticalMargin || 'none');
    }
  });
  return margin;
};

export default formatMargin;
