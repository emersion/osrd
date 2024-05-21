import React from 'react';

import { Button } from '@osrd-project/ui-core';
import { Location, ArrowUp, ArrowDown } from '@osrd-project/ui-icons';
import { useSelector } from 'react-redux';

import STDCM_REQUEST_STATUS from 'applications/stdcm/consts';
import useStdcm from 'applications/stdcm/views/useStdcm';
import { useOsrdConfSelectors } from 'common/osrdContext';
import ScenarioExplorer from 'modules/scenario/components/ScenarioExplorer';
import { Map } from 'modules/trainschedule/components/ManageTrainSchedule';

import StdcmConsist from '../components/StdcmConsist';
import StdcmDefaultCard from '../components/StdcmDefaultCard';
import StdcmDestination from '../components/StdcmDestination';
import StdcmHeader from '../components/StdcmHeader';
import StdcmOrigin from '../components/StdcmOrigin';

// TODO
// - translate labels

export default function OSRDSTDCM() {
  const { getProjectID, getScenarioID, getStudyID } = useOsrdConfSelectors();
  const studyID = useSelector(getStudyID);
  const projectID = useSelector(getProjectID);
  const scenarioID = useSelector(getScenarioID);
  const { launchStdcmRequestV2, setCurrentStdcmRequestStatus, currentStdcmRequestStatus } =
    useStdcm();
  const isPending = currentStdcmRequestStatus === STDCM_REQUEST_STATUS.pending;
  console.log('isPending', currentStdcmRequestStatus, isPending);

  return (
    <div className="stdcm-v2">
      <StdcmHeader />
      <div className="stdcm-v2__body">
        <div className="stdcm-v2-simulation-settings">
          <div>
            <ScenarioExplorer
              globalProjectId={projectID}
              globalStudyId={studyID}
              globalScenarioId={scenarioID}
            />
            <StdcmConsist isPending={isPending} />
          </div>
          <div className="stdcm-v2__separator" />
          <div className="stdcm-v2-simulation-itinirary">
            {/* //TODO: rename StdcmDefaultCard */}
            <StdcmDefaultCard text="Indiquer le sillon antérieur" Icon={<ArrowUp size="lg" />} />
            <StdcmOrigin />
            <StdcmDefaultCard text="Ajouter un passage" Icon={<Location size="lg" />} />
            <StdcmDestination />
            <StdcmDefaultCard text="Indiquer le sillon postérieur" Icon={<ArrowDown size="lg" />} />
            <Button
              label="Obtenir la simulation"
              onClick={() => {
                setCurrentStdcmRequestStatus(STDCM_REQUEST_STATUS.pending);
                launchStdcmRequestV2();
              }}
            />
          </div>
        </div>
        <div className="osrd-config-item-container osrd-config-item-container-map stdcm-v2-map">
          <Map />
        </div>
        <div />
      </div>
    </div>
  );
}
