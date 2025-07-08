import React from 'react';
import DashboardButton from './DashboardButton';

interface Props {
  title?: string;
  children?: string;
  onPress: () => void;
  variant?: 'default' | 'green' | 'blue' | 'redSolid';
  disabled?: boolean;
}

const AppButton = ({
  title,
  children,
  onPress,
  variant = 'default',
  disabled = false,
}: Props) => {
  const buttonText = title || children || 'Press Me';

  return (
    <DashboardButton
      text={buttonText}
      onPress={onPress}
      variant={variant}
      disabled={disabled}
    />
  );
};

export default AppButton;
