import React from 'react';
import { View, Button } from 'react-native';

const BlockLoginButton = ({ userId }: { userId: string }) => {
  const handleBlockLogin = async () => {
    try {
      const result = await blockLoginById(userId);
      alert(`Login block toggled: ${result?.loginBlocked ? 'Blocked' : 'Unblocked'}`);
    } catch (err) {
      alert('Failed to update login block status.');
    }
  };

  return (
    <View style={{ margin: 10 }}>
      <Button title="Toggle Login Block" onPress={handleBlockLogin} />
    </View>
  );
};

export default BlockLoginButton;
