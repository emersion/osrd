import React, { useContext, useEffect, useState } from 'react';

import { cloneDeep, isEmpty, keyBy, pick } from 'lodash';
import { useTranslation } from 'react-i18next';

import EntityError from 'applications/editor/components/EntityError';
import EditorContext from 'applications/editor/context';
import { NEW_ENTITY_ID } from 'applications/editor/data/utils';
import ElectrificationMetadataForm from 'applications/editor/tools/rangeEdition/electrification/ElectrificationMetadataForm';
import EditPSLSection from 'applications/editor/tools/rangeEdition/speedSection/EditPSLSection';
import SpeedSectionMetadataForm from 'applications/editor/tools/rangeEdition/speedSection/SpeedSectionMetadataForm';
import type {
  RouteTrackRanges,
  RangeEditionState,
  SpeedSectionEntity,
  SpeedSectionPslEntity,
} from 'applications/editor/tools/rangeEdition/types';
import { speedSectionIsPsl } from 'applications/editor/tools/rangeEdition/utils';
import type { ExtendedEditorContextType, PartialOrReducer } from 'applications/editor/types';
import {
  osrdEditoastApi,
  type GetInfraByInfraIdRoutesTrackRangesApiResponse,
} from 'common/api/osrdEditoastApi';
import CheckboxRadioSNCF from 'common/BootstrapSNCF/CheckboxRadioSNCF';
import { useInfraID } from 'common/osrdContext';
import { toggleElement } from 'utils/array';

import TrackRangesList from './RangeEditionTrackRangeList';
import RouteList from './RouteList';
import SwitchList from '../speedSection/SwitchList';

const RangeEditionLeftPanel = () => {
  const { t } = useTranslation();
  const {
    setState,
    state: {
      entity,
      initialEntity,
      trackSectionsCache,
      selectedSwitches,
      highlightedRoutes,
      routesTrackRanges,
    },
  } = useContext(EditorContext) as ExtendedEditorContextType<RangeEditionState<SpeedSectionEntity>>;

  const [slowDown3060, setSlowDown3060] = useState(false);

  const [getRoutesFromSwitch] =
    osrdEditoastApi.endpoints.postInfraByInfraIdRoutesNodes.useMutation();

  const [getTrackRangesByRoutes] =
    osrdEditoastApi.endpoints.getInfraByInfraIdRoutesTrackRanges.useLazyQuery();

  const [switchesRouteCandidates, setSwitchesRouteCandidates] = useState<string[] | null>(null);
  const toggleSlowDown3060 = () => {
    setSlowDown3060(!slowDown3060);
    const selectiontype = slowDown3060 ? 'idle' : 'selectSwitch';
    const newEntity = cloneDeep(entity) as SpeedSectionEntity;
    if (newEntity.properties.extensions) {
      newEntity.properties.extensions = undefined;
    }
    setState({
      entity: newEntity,
      interactionState: { type: selectiontype },
      selectedSwitches: [],
    });
  };

  const isNew = entity.properties.id === NEW_ENTITY_ID;
  const isPSL = speedSectionIsPsl(entity as SpeedSectionEntity);
  const infraID = useInfraID();

  const { data: voltages } = osrdEditoastApi.endpoints.getInfraByInfraIdVoltages.useQuery(
    {
      infraId: infraID as number,
    },
    { skip: !infraID }
  );

  const updateSpeedSectionExtensions = (
    extensions: SpeedSectionEntity['properties']['extensions']
  ) => {
    const newEntity = cloneDeep(entity) as SpeedSectionEntity;
    newEntity.properties.extensions = extensions;
    setState({
      entity: newEntity,
    });
  };
  const unselectSwitch = (swId: string) => () => {
    setState({
      selectedSwitches: selectedSwitches.filter((s) => s !== swId),
    });
  };

  const makeTrackRangesByRouteName = (
    trackRangesResults: GetInfraByInfraIdRoutesTrackRangesApiResponse,
    routes: string[]
  ): RouteTrackRanges =>
    trackRangesResults.reduce((acc, cur, index) => {
      if (cur.type === 'Computed') {
        const renamedFieldsTrackRanges = cur.track_ranges.map((trackRange) => {
          const { begin, end, track } = trackRange;
          return {
            begin,
            end,
            track,
            applicable_directions: trackRange.direction,
          };
        });
        return { ...acc, [routes[index]]: renamedFieldsTrackRanges };
      }
      return acc;
    }, {});

  const searchRoutesFromSwitch = async () => {
    const body = selectedSwitches.reduce(
      (accumulator, switchId) => ({ ...accumulator, [switchId]: null }),
      {}
    );
    setState({
      optionsState: { type: 'loading' },
    });
    const routesAndNodesPositions = await getRoutesFromSwitch({
      infraId: infraID as number,
      body,
    }).unwrap();
    const { routes, available_node_positions } = routesAndNodesPositions;
    setSwitchesRouteCandidates(routes);
    const trackRangesResults = await getTrackRangesByRoutes({
      infraId: infraID as number,
      routes: routes.join(','),
    }).unwrap();
    const trackRangesByRouteName = makeTrackRangesByRouteName(trackRangesResults, routes);
    setState({
      routesTrackRanges: trackRangesByRouteName,
      optionsState: { type: 'idle' },
    });
  };

  const handleRouteClicked = (select: boolean) => async (routeId: string) => {
    if (!isEmpty(routesTrackRanges)) {
      const newEntity = cloneDeep(entity) as SpeedSectionEntity;
      const { properties } = newEntity;
      if (select) {
        properties.on_routes = toggleElement(properties.on_routes || [], routeId);
        properties.track_ranges = Object.values(
          pick(routesTrackRanges, properties.on_routes)
        ).flat();
        setState({
          optionsState: { type: 'idle' },
          entity: newEntity,
          ...(highlightedRoutes.includes(routeId) !== properties.on_routes.includes(routeId) && {
            highlightedRoutes: toggleElement(highlightedRoutes, routeId),
          }),
        });
      } else {
        const newHighlightedRoutes = toggleElement(highlightedRoutes, routeId);
        setState({
          optionsState: { type: 'idle' },
          highlightedRoutes: newHighlightedRoutes,
        });
      }
    }
  };

  useEffect(() => {
    if (switchesRouteCandidates && switchesRouteCandidates.length > 0) {
      handleRouteClicked(true)(switchesRouteCandidates[0]);
    }
  }, [switchesRouteCandidates]);

  useEffect(() => {
    if (switchesRouteCandidates && switchesRouteCandidates.length) setSwitchesRouteCandidates(null);
  }, [selectedSwitches]);

  return (
    <div>
      <legend className="mb-4">
        {t(
          `Editor.obj-types.${
            entity.objType === 'SpeedSection' ? 'SpeedSection' : 'Electrification'
          }`
        )}
      </legend>
      {initialEntity.objType === 'SpeedSection' ? (
        <SpeedSectionMetadataForm />
      ) : (
        voltages && <ElectrificationMetadataForm voltages={voltages} />
      )}
      <hr />
      {initialEntity.objType === 'SpeedSection' && (
        <>
          <div>
            {!slowDown3060 && (
              <div className="d-flex">
                <CheckboxRadioSNCF
                  type="checkbox"
                  id="is-psl-checkbox"
                  name="is-psl-checkbox"
                  checked={isPSL}
                  disabled={entity.properties.track_ranges?.length === 0}
                  label={t('Editor.tools.speed-edition.toggle-psl')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    let newExtension: SpeedSectionEntity['properties']['extensions'] = {
                      psl_sncf: null,
                    };
                    if (e.target.checked) {
                      const firstRange = (entity.properties?.track_ranges || [])[0];
                      if (!firstRange) return;
                      newExtension = {
                        psl_sncf: initialEntity.properties?.extensions?.psl_sncf || {
                          announcement: [],
                          r: [],
                          z: {
                            direction: 'START_TO_STOP',
                            position: firstRange.begin,
                            side: 'LEFT',
                            track: firstRange.track,
                            type: 'Z',
                            value: '',
                            kp: '',
                          },
                        },
                      };
                    }
                    updateSpeedSectionExtensions(newExtension);
                  }}
                />
              </div>
            )}

            {!slowDown3060 && entity.properties.track_ranges?.length === 0 && (
              <p className="mt-3 font-size-1">{t('Editor.tools.speed-edition.toggle-psl-help')}</p>
            )}
            {!isPSL && (
              <div className="d-flex">
                <CheckboxRadioSNCF
                  type="checkbox"
                  id="get-route-from-switch"
                  name="get-route-from-switch"
                  checked={slowDown3060}
                  label={t('Editor.tools.speed-edition.ralen-30-60')}
                  onChange={toggleSlowDown3060}
                />
              </div>
            )}
            {!slowDown3060 && isPSL && (
              <EditPSLSection
                entity={entity as SpeedSectionPslEntity}
                setState={
                  setState as (
                    stateOrReducer: PartialOrReducer<RangeEditionState<SpeedSectionEntity>>
                  ) => void
                }
                trackSectionsCache={trackSectionsCache}
              />
            )}
          </div>
          <hr />
        </>
      )}
      {slowDown3060 && (
        <>
          {t('Editor.tools.speed-edition.select-switches-to-get-route')}
          {selectedSwitches.length > 0 && (
            <>
              <SwitchList selectedSwitches={selectedSwitches} unselectSwitch={unselectSwitch} />
              <button
                type="button"
                className="btn btn-primary btn-sm mt-2 mb-2"
                onClick={searchRoutesFromSwitch}
              >
                {t('Editor.tools.speed-edition.search-routes')}
              </button>
              {switchesRouteCandidates && switchesRouteCandidates.length === 0 && (
                <p className="text-muted">
                  {t('Editor.tools.routes-edition.routes', { count: 0 })}
                </p>
              )}
            </>
          )}
          <hr />
        </>
      )}
      {switchesRouteCandidates && switchesRouteCandidates.length > 0 && (
        <RouteList
          switchesRouteCandidates={switchesRouteCandidates}
          onRouteSelect={handleRouteClicked(true)}
          selectedRoutes={entity.properties.on_routes || []}
          onRouteHighlight={handleRouteClicked(false)}
          highlightedRoutes={highlightedRoutes}
        />
      )}

      <TrackRangesList />

      {!isNew && <EntityError className="mt-1" entity={entity} />}
    </div>
  );
};

export default RangeEditionLeftPanel;
