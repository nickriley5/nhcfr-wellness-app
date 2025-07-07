import React from 'react';
import DashboardButton from '../Common/DashboardButton';

interface Props {
  onPress: () => void;
}

const CheckInButton = ({ onPress }: Props) => {
  return (
    <DashboardButton
      text="Check In Now"
      onPress={onPress}
      variant="green"
    />
  );
};

export default CheckInButton;
