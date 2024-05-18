import React, { useContext, useState } from 'react';

import { cloneDeep, groupBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { MdShowChart } from 'react-icons/md';

import EntitySumUp from 'applications/editor/components/EntitySumUp';
import EditorContext from 'applications/editor/context';
import { APPLICABLE_DIRECTIONS } from 'applications/editor/tools/rangeEdition/consts';
import type {
  ApplicableDirection,
  ApplicableTrackRange,
  ElectrificationEntity,
  RangeEditionState,
  SpeedSectionEntity,
} from 'applications/editor/tools/rangeEdition/types';
import type { ExtendedEditorContextType } from 'applications/editor/types';
import { LoaderFill } from 'common/Loaders';

const DEFAULT_DISPLAYED_RANGES_COUNT = 5;

const TrackRangesList = () => {
  const {
    state: { entity, trackSectionsCache, routeElements },
    setState,
  } = useContext(EditorContext) as ExtendedEditorContextType<
    RangeEditionState<SpeedSectionEntity | ElectrificationEntity>
  >;
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const ranges = entity.properties.track_ranges || [];
  const displayedRanges = showAll ? ranges : ranges.slice(0, DEFAULT_DISPLAYED_RANGES_COUNT);

  const rangesByRoute = groupBy(displayedRanges, (range) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [routeKey, { trackRanges }] of Object.entries(routeElements)) {
      if (trackRanges.includes(range)) {
        return routeKey;
      }
    }
    return undefined;
  });

  const makeTrackJSX = (range: ApplicableTrackRange, i: number) => {
    const trackState = trackSectionsCache[range.track];

    return (
      <li key={i} className="mb-4 d-flex flex-row align-items-center">
        {(!trackState || trackState.type === 'loading') && (
          <div className="position-relative w-100" style={{ height: 50 }}>
            <LoaderFill className="bg-transparent" />
          </div>
        )}
        {trackState?.type === 'success' && (
          <div className="flex-grow-1 flex-shrink-1 ml-3">
            <EntitySumUp entity={trackState.track} />
            {entity.objType !== 'Electrification' && (
              <select
                id="filterLevel"
                className="w-75"
                value={range.applicable_directions}
                onChange={(e) => {
                  const newEntity = cloneDeep(entity);
                  const newRange = (newEntity.properties.track_ranges || [])[i];
                  newRange.applicable_directions = e.target.value as ApplicableDirection;
                  setState({ entity: newEntity, hoveredItem: null });
                }}
              >
                {APPLICABLE_DIRECTIONS.map((direction) => (
                  <option key={direction} value={direction}>
                    {t(`Editor.directions.${direction}`)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </li>
    );
  };
  const fullTrackList = Object.entries(rangesByRoute).reduce<JSX.Element[]>(
    (acc, [route, tracks]) => {
      const routeJSX = <h3>{route}</h3>;
      const routeTracks = tracks.map(makeTrackJSX);
      return [...acc, routeJSX, ...routeTracks];
    },
    []
  );
  return (
    <div>
      <h4 className="pb-2">
        <MdShowChart className="me-1" /> {t('Editor.tools.range-edition.linked-track-sections')}
      </h4>
      {displayedRanges.length === 0 ? (
        <p className="text-muted mt-3 text-center">
          {t('Editor.tools.range-edition.empty-linked-track-section')}
        </p>
      ) : (
        <ul className="list-unstyled">{fullTrackList}</ul>
      )}
      {ranges.length > DEFAULT_DISPLAYED_RANGES_COUNT && (
        <div className="mt-4">
          <button
            type="button"
            className="btn btn-secondary w-100 text-wrap"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll
              ? t('Editor.tools.range-edition.only-show-n', {
                  count: DEFAULT_DISPLAYED_RANGES_COUNT,
                })
              : t('Editor.tools.range-edition.show-more-ranges', {
                  count: displayedRanges.length - DEFAULT_DISPLAYED_RANGES_COUNT,
                })}
          </button>
        </div>
      )}
    </div>
  );
};

export default TrackRangesList;
