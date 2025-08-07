import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import { storeAppData, getAppData } from '../utils/AppDataStorage';

const CHECKBOX_KEY = 'checkbox_states';

const initialItems = [
  { id: 1, label: 'Option 1', checked: false },
  { id: 2, label: 'Option 2', checked: false },
];

export default function CheckboxList() {
  const [items, setItems] = useState(initialItems);

  // Load saved state on mount
  useEffect(() => {
    (async () => {
      const saved = await getAppData(CHECKBOX_KEY);
      if (saved) setItems(saved);
    })();
  }, []);

  // Save state whenever items change
  useEffect(() => {
    storeAppData(CHECKBOX_KEY, items);
  }, [items]);

  const toggleCheckbox = (id) => {
    setItems(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <View>
      {items.map(item => (
        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <CheckBox
            value={item.checked}
            onValueChange={() => toggleCheckbox(item.id)}
          />
          <Text>{item.label}</Text>
        </View>
      ))}
      <Button title="Log Saved State" onPress={async () => {
        const saved = await getAppData(CHECKBOX_KEY);
        console.log(saved);
      }} />
    </View>
  );
}