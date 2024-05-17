import React from 'react';

import cx from 'classnames';

import type { LightRollingStockWithLiveries } from 'common/api/osrdEditoastApi';
import RollingStock2Img from 'modules/rollingStock/components/RollingStock2Img';

export type StdcmCardProps<T extends LightRollingStockWithLiveries> = {
  name?: string;
  hasTip?: boolean;
  imageSource?: T;
  children: React.ReactNode;
};

export default function StdcmCard<T extends LightRollingStockWithLiveries>({
  name,
  hasTip = false,
  imageSource,
  children,
}: StdcmCardProps<T>) {
  return (
    <div className={cx('stdcm-v2-card', { 'has-tip': hasTip })}>
      {name && (
        <div className="stdcm-v2-card__header d-flex justify-content-between">
          <span>{name}</span>
          {imageSource && (
            <div className="consist-img w-50">
              <RollingStock2Img rollingStock={imageSource} />
            </div>
          )}
        </div>
      )}
      <div className="stdcm-v2-card__body">{children}</div>
    </div>
  );
}
