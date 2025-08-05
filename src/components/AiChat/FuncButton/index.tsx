import React from 'react';
import { Button } from 'antd';

import './index.scss';

interface FuncButtonProps {
  quickActions: {
    key: string;
    icon: React.ReactElement;
    label: string;
    // color: string;
  }[];
  handleMenuClick: (e: any) => void;
}

function FuncButton({ quickActions, handleMenuClick }: FuncButtonProps) {
  return (
    <div className="quick-actions">
      {quickActions.map((action, index) => (
        <Button
          className="action-button"
          key={index}
          size="large"
          value={action.key}
          icon={React.cloneElement(action.icon)}
          onClick={handleMenuClick}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

export default FuncButton;
