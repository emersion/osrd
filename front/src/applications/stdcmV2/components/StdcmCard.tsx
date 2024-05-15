import React from 'react';

import cx from 'classnames';

export type StdcmCardProps = {
  name?: string;
  hasTip?: boolean;
  children: React.ReactNode;
};

export default function StdcmCard({ name, hasTip = false, children }: StdcmCardProps) {
  return (
    <div className={cx('stdcm-v2-card', { 'has-tip': hasTip })}>
      {name && <div className="stdcm-v2-card__header">{name}</div>}
      <div className="stdcm-v2-card__body">{children}</div>
    </div>
  );
}
