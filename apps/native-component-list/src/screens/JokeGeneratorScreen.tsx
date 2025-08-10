import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Alert } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';

interface Joke {
  type: string;
  setup: string;
  punchline: string;
  id: number;
}

// Fallback jokes for when the API is unavailable (testing/offline mode)
const FALLBACK_JOKES: Joke[] = [
  {
    type: 'general',
    setup: 'Why don\'t scientists trust atoms?',
    punchline: 'Because they make up everything!',
    id: 1,
  },
  {
    type: 'programming',
    setup: 'Why do programmers prefer dark mode?',
    punchline: 'Because light attracts bugs!',
    id: 2,
  },
  {
    type: 'general',
    setup: 'What do you call a bear with no teeth?',
    punchline: 'A gummy bear!',
    id: 3,
  },
];

interface JokeState {
  joke: Joke | null;
  loading: boolean;
  error: string | null;
}

export default function JokeGeneratorScreen() {
  const [state, setState] = useState<JokeState>({
    joke: null,
    loading: false,
    error: null,
  });

  const fetchRandomJoke = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch('https://official-joke-api.appspot.com/random_joke');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const joke: Joke = await response.json();
      setState({ joke, loading: false, error: null });
    } catch (error) {
      // If API fails, use fallback jokes for demo purposes
      const randomIndex = Math.floor(Math.random() * FALLBACK_JOKES.length);
      const fallbackJoke = FALLBACK_JOKES[randomIndex];
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.warn('Joke API failed, using fallback:', errorMessage);
      
      setState({ 
        joke: { ...fallbackJoke, type: `${fallbackJoke.type} (offline)` }, 
        loading: false, 
        error: null 
      });
      
      // Show a brief toast-like message instead of blocking alert
      Alert.alert(
        'Network Notice', 
        'Using offline jokes. Check your internet connection for fresh content.',
        [{ text: 'OK' }],
        { cancelable: true }
      );
    }
  };

  const { joke, loading, error } = state;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <HeadingText style={styles.title}>Random Joke Generator</HeadingText>
        
        <Text style={styles.description}>
          Tap the button below to fetch a random joke from the Official Joke API!
        </Text>

        <Button
          title={loading ? 'Fetching Joke...' : 'Get Random Joke'}
          onPress={fetchRandomJoke}
          loading={loading}
          style={styles.button}
        />

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}

        {joke && !loading && (
          <View style={styles.jokeContainer}>
            <HeadingText style={styles.jokeLabel}>Setup:</HeadingText>
            <Text style={styles.jokeSetup}>{joke.setup}</Text>
            
            <HeadingText style={styles.jokeLabel}>Punchline:</HeadingText>
            <Text style={styles.jokePunchline}>{joke.punchline}</Text>
            
            <Text style={styles.jokeInfo}>
              Type: {joke.type} | ID: {joke.id}
            </Text>
          </View>
        )}

        {!joke && !loading && !error && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              No joke loaded yet. Tap the button to get started! 😊
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
  },
  button: {
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  jokeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jokeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  jokeSetup: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: '#444',
    fontStyle: 'italic',
  },
  jokePunchline: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
    color: '#444',
    fontWeight: '500',
  },
  jokeInfo: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  placeholderContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
});

JokeGeneratorScreen.navigationOptions = {
  title: 'Joke Generator',
};