import React from 'react';

import StdcmCard from './StdcmCard';

type StdcmCardProps = {
  text: string;
  Icon: React.ReactNode;
};
export default function StdcmDefaultCard({ text, Icon }: StdcmCardProps) {
  return (
    <StdcmCard hasTip>
      <div>
        <span>{Icon}</span>
        <span>{text}</span>
      </div>
    </StdcmCard>
  );
}
