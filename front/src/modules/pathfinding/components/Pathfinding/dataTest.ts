import { type PathProperties } from 'common/api/osrdEditoastApi';

const dataTest: PathProperties['operational_points'] = [
  {
    extensions: {
      identifier: {
        name: 'Paris',
        uic: 1234567,
      },
      sncf: {
        ch: 'BV',
        ch_long_label: 'Batiment Voyageurs',
        ch_short_label: 'BV',
        ci: 0,
        trigram: 'PAR',
      },
    },
    id: '1234567',
    part: {
      position: 0,
      track: '123',
    },
    /** Distance from the beginning of the path in mm */
    position: 0,
  },
  {
    extensions: {
      identifier: {
        name: 'Paris-La Villette',
        uic: 765435,
      },
      sncf: {
        ch: 'BV',
        ch_long_label: 'Batiment Voyageurs',
        ch_short_label: 'BV',
        ci: 0,
        trigram: 'PLV',
      },
    },
    id: '76543210',
    part: {
      position: 0,
      track: '3548',
    },
    /** Distance from the beginning of the path in mm */
    position: 1000,
  },
  {
    extensions: {
      identifier: {
        name: 'Paris-La Villette',
        uic: 765435,
      },
      sncf: {
        ch: 'PK',
        ch_long_label: 'Point Kilometrique',
        ch_short_label: 'PK',
        ci: 0,
        trigram: 'PLV',
      },
    },
    id: '76543211',
    part: {
      position: 0,
      track: '3548',
    },
    /** Distance from the beginning of the path in mm */
    position: 1500,
  },
  {
    extensions: {
      identifier: {
        name: 'Noisy',
        uic: 76543,
      },
      sncf: {
        ch: 'BV',
        ch_long_label: 'Batiment Voyageurs',
        ch_short_label: 'BV',
        ci: 0,
        trigram: 'NSY',
      },
    },
    id: '7654321',
    part: {
      position: 0,
      track: '354',
    },
    /** Distance from the beginning of the path in mm */
    position: 2000,
  },
];

export default dataTest;
