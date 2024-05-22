import { useSelector } from 'react-redux';

import { useInfraID } from 'common/osrdContext';
import { updateSelectedTrainId } from 'reducers/osrdsimulation/actions';
import {
  getAllowancesSettings,
  getIsPlaying,
  getPresentSimulation,
  getSelectedProjection,
  getSelectedTrain,
  getSelectedTrainId,
} from 'reducers/osrdsimulation/selectors';
import { persistentUpdateSimulation } from 'reducers/osrdsimulation/simulation';
import type { SimulationSnapshot } from 'reducers/osrdsimulation/types';
import { useAppDispatch } from 'store';

export const useStoreDataForSpaceTimeChart = () => {
  const dispatch = useAppDispatch();

  const infraId = useInfraID();

  return {
    allowancesSettings: useSelector(getAllowancesSettings),
    infraId,
    selectedTrainId: useSelector(getSelectedTrainId),
    selectedTrain: useSelector(getSelectedTrain),
    selectedProjection: useSelector(getSelectedProjection),
    simulation: useSelector(getPresentSimulation),
    simulationIsPlaying: useSelector(getIsPlaying),
    dispatchUpdateSelectedTrainId: (_selectedTrainId: number) => {
      dispatch(updateSelectedTrainId(_selectedTrainId));
    },
    dispatchPersistentUpdateSimulation: (simulation: SimulationSnapshot) => {
      dispatch(persistentUpdateSimulation(simulation));
    },
  };
};

export default useStoreDataForSpaceTimeChart;
