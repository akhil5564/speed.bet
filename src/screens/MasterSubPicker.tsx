import React from 'react';
import { View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type User = {
  _id: string;
  username: string;
  usertype: string; // 'master' or 'sub'
};

type Props = {
  allUsers: User[];
  selectedMaster: string;
  setSelectedMaster: (val: string) => void;
  createdBy: string; // username of the user to show on right picker
  setCreatedBy: (val: string) => void;
};

const MasterCreatedByPicker: React.FC<Props> = ({
  allUsers,
  selectedMaster,
  setSelectedMaster,
  createdBy,
  setCreatedBy,
}) => {
  const masterUsers = allUsers.filter((u) => u.usertype === 'master');

  // Find the user object for createdBy username
  const createdByUser = allUsers.find((u) => u.username === createdBy);

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
      {/* Master Picker */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Picker
          selectedValue={selectedMaster}
          onValueChange={(val) => setSelectedMaster(val)}
          style={{ backgroundColor: '#fff' }}
        >
          {masterUsers.map((user) => (
            <Picker.Item key={user._id} label={user.username} value={user.username} />
          ))}
        </Picker>
      </View>

      {/* CreatedBy Picker - shows only one item matching createdBy */}
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Picker
          selectedValue={createdBy}
          onValueChange={(val) => setCreatedBy(val)}
          style={{ backgroundColor: '#fff' }}
        >
          {createdByUser ? (
            <Picker.Item key={createdByUser._id} label={createdByUser.username} value={createdByUser.username} />
          ) : (
            <Picker.Item label="No user selected" value="" />
          )}
        </Picker>
      </View>
    </View>
  );
};

export default MasterCreatedByPicker;
