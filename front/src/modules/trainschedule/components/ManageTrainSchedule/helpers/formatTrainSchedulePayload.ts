/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TrainScheduleBase } from 'common/api/osrdEditoastApi';

import type { ValidConfig } from '../types';

export default function formatTrainSchedulePayload(
  validConfig: ValidConfig,
  trainName: string,
  startTime: string
): TrainScheduleBase {
  const {
    rollingStockName,
    path,
    labels,
    speedLimitByTag,
    initialSpeed,
    usingElectricalProfiles,
    rollingStockComfort,
  } = validConfig;

  return {
    comfort: rollingStockComfort,
    // TODO TS2 : add a switch somewhere in the app to let the user chose (and add it to store)
    constraint_distribution: 'MARECO',
    initial_speed: initialSpeed,
    labels,
    // TODO TS2 : handle margins
    // margins: validConfig.margins,
    options: {
      use_electrical_profiles: usingElectricalProfiles,
    },
    path,
    // TODO TS2 : handle power restrictions
    // power_restrictions: validConfig.powerRestrictions,
    rolling_stock_name: rollingStockName,
    // TODO TS2 : handle handle margins
    // schedule: validConfig.pathSteps.***
    speed_limit_tag: speedLimitByTag,
    start_time: startTime,
    train_name: trainName,
  };
}
