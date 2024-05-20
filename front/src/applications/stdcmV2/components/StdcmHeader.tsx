import React from 'react';

export default function StdcmHeader() {
  return (
    <div className="stdcm-v2-header">
      <span className="stdcm-v2-header__title">ST DCM</span>
      <span className="stdcm-v2-header__notification" id="notification">
        Phase 1 : de J-7 à J-1 17h, sur l’axe Perrigny—Miramas.{' '}
        <a href="#notification">Plus d’informations</a>
      </span>
    </div>
  );
}
