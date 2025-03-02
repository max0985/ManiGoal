import React from 'react';
import { View } from 'react-native';
import ChatScreen from '../../components/chat/ChatScreen';

export default function ChatRoute() {
  return (
    <View style={{ flex: 1 }}>
      <ChatScreen />
    </View>
  );
}