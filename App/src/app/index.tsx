import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import React from 'react'
import Chat from './Components/Chat'

const Index = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Chat />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    // padding: 10,
  }
})

export default Index