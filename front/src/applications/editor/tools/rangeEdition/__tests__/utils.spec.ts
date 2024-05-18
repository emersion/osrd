import type { OrderedRouteElementApplicable } from '../types';
import { getTracksBetweenExtremeSwitches } from '../utils';

describe('getTracksBetweenExtremeSwitches', () => {
  it('should get the tracks between given switches', () => {
    const orderedRouteElements: OrderedRouteElementApplicable[] = [
      {
        TrackRange: {
          track: '61a207e4-6667-11e3-81ff-01f464e0362d',
          begin: 0,
          end: 202,
          applicable_directions: 'STOP_TO_START',
        },
      },
      {
        Switch: 'switch.11191',
      },
      {
        TrackRange: {
          track: '61a20360-6667-11e3-81ff-01f464e0362d',
          begin: 0,
          end: 38,
          applicable_directions: 'STOP_TO_START',
        },
      },
      {
        Switch: 'switch.11190',
      },
      {
        TrackRange: {
          track: '61a1fed8-6667-11e3-81ff-01f464e0362d',
          begin: 0,
          end: 56,
          applicable_directions: 'STOP_TO_START',
        },
      },
      {
        Switch: 'switch.11189',
      },
      {
        TrackRange: {
          track: '61a1fa2c-6667-11e3-81ff-01f464e0362d',
          begin: 0,
          end: 269,
          applicable_directions: 'STOP_TO_START',
        },
      },
      {
        Switch: 'switch.11188',
      },
      {
        TrackRange: {
          track: '61a1f100-6667-11e3-81ff-01f464e0362d',
          begin: 148,
          end: 835,
          applicable_directions: 'STOP_TO_START',
        },
      },
    ];
    const selectedSwitches = {
      'switch.11189': {
        position: null,
        type: 'point_switch',
      },
      'switch.11191': {
        position: null,
        type: 'link',
      },
    };
    const result = getTracksBetweenExtremeSwitches(orderedRouteElements, selectedSwitches);
    expect(result).toEqual([
      {
        TrackRange: {
          track: '61a20360-6667-11e3-81ff-01f464e0362d',
          begin: 0,
          end: 38,
          direction: 'STOP_TO_START',
        },
      },
      {
        TrackRange: {
          track: '61a1fed8-6667-11e3-81ff-01f464e0362d',
          begin: 0,
          end: 56,
          direction: 'STOP_TO_START',
        },
      },
    ]);
  });
});
