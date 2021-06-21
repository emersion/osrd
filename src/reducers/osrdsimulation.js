/* eslint-disable default-case */
import produce from 'immer';

// Action Types
export const UPDATE_CHART = 'osrdsimu/UPDATE_CHART';
export const UPDATE_SIMULATION = 'osrdsimu/UPDATE_SIMULATION';
export const TOGGLE_WORKINGSTATUS = 'osrdsimu/TOGGLE_WORKINGSTATUS';

// Reducer
export const initialState = {
  chart: undefined,
  isWorking: false,
  simulationRaw: undefined,
};

export default function reducer(state = initialState, action) {
  return produce(state, (draft) => {
    switch (action.type) {
      case UPDATE_CHART:
        draft.chart = action.chart;
        break;
      case UPDATE_SIMULATION:
        draft.simulationRaw = action.simulationRaw;
        break;
      case TOGGLE_WORKINGSTATUS:
        draft.isWorking = action.isWorking;
        break;
    }
  });
}

// Functions
export function updateChart(chart) {
  return (dispatch) => {
    dispatch({
      type: UPDATE_CHART,
      chart,
    });
  };
}
export function updateSimulation(simulationRaw) {
  return (dispatch) => {
    dispatch({
      type: UPDATE_SIMULATION,
      simulationRaw,
    });
  };
}
export function toggleWorkingStatus(bool) {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_WORKINGSTATUS,
      isWorking: bool,
    });
  };
}
