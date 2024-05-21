import React, { useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import ReactModal from 'react-modal';
import { useSelector } from 'react-redux';

import STDCM_REQUEST_STATUS from 'applications/stdcm/consts';
import type { StdcmRequestStatus } from 'applications/stdcm/types';
import ModalBodySNCF from 'common/BootstrapSNCF/ModalSNCF/ModalBodySNCF';
import ModalHeaderSNCF from 'common/BootstrapSNCF/ModalSNCF/ModalHeaderSNCF';
import { Spinner } from 'common/Loaders';
import { getTrainScheduleV2Activated } from 'reducers/user/userSelectors';

export type StdcmRequestModalProps = {
  currentStdcmRequestStatus: StdcmRequestStatus;
  launchStdcmRequest: () => void;
  launchStdcmRequestV2: () => void;
  cancelStdcmRequest: () => void;
};

const StdcmRequestModal = ({
  currentStdcmRequestStatus,
  launchStdcmRequest,
  launchStdcmRequestV2,
  cancelStdcmRequest,
}: StdcmRequestModalProps) => {
  const { t } = useTranslation(['translation', 'stdcm']);
  const trainScheduleV2Activated = useSelector(getTrainScheduleV2Activated);

  useEffect(() => {
    if (currentStdcmRequestStatus === STDCM_REQUEST_STATUS.pending) {
      if (trainScheduleV2Activated) {
        launchStdcmRequestV2();
      } else {
        launchStdcmRequest();
      }
    }
  }, [currentStdcmRequestStatus]);

  return (
    <ReactModal
      isOpen={currentStdcmRequestStatus === STDCM_REQUEST_STATUS.pending}
      id="stdcmRequestModal"
      className="modal-dialog-centered"
      style={{ overlay: { zIndex: 3 } }}
      ariaHideApp={false}
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <ModalHeaderSNCF>
            <h1>{t('stdcm:stdcmComputation')}</h1>
          </ModalHeaderSNCF>
          <ModalBodySNCF>
            <div className="d-flex flex-column text-center">
              {currentStdcmRequestStatus === STDCM_REQUEST_STATUS.pending && (
                <div className="d-flex align-items-center justify-content-center mb-3">
                  <span className="mr-2">{t('stdcm:pleaseWait')}</span>
                  <Spinner />
                </div>
              )}

              <div className="text-center p-1">
                <button
                  className="btn btn-sm btn-secondary"
                  type="button"
                  onClick={cancelStdcmRequest}
                >
                  {t('stdcm:cancelRequest')}
                  <span className="sr-only" aria-hidden="true">
                    {t('stdcm:cancelRequest')}
                  </span>
                </button>
              </div>
            </div>
          </ModalBodySNCF>
        </div>
      </div>
    </ReactModal>
  );
};

export default StdcmRequestModal;
