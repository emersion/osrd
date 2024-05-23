import React, { forwardRef } from 'react';

import { Button } from '@osrd-project/ui-core';

import stdcmLoaderImg from 'assets/pictures/views/stdcm_v2_loader.jpg';

type StdcmLoaderProps = {
  cancelStdcmRequest: () => void;
};

const StdcmLoader = forwardRef(
  ({ cancelStdcmRequest }: StdcmLoaderProps, ref: React.Ref<HTMLDivElement>) => (
    <div
      ref={ref}
      className="stdcm-v2-loader d-flex flex-column justify-content-center align-items-center"
    >
      <div className="stdcm-v2-loader__wrapper">
        <h1>Calcul en cours...</h1>
        <p>
          Pour votre demande, le temps nécessaire <br /> est généralement de 90 secondes
        </p>
      </div>
      <div className="stdcm-v2-loader__cancel-btn">
        <Button
          variant="Cancel"
          label="Arrêter le calcul"
          size="small"
          onClick={cancelStdcmRequest}
        />
      </div>
      <img src={stdcmLoaderImg} alt="simulation en cours" />
      <p className="stdcm-v2-loader__img-signature">La ligne TGV Nord</p>
    </div>
  )
);

export default StdcmLoader;
