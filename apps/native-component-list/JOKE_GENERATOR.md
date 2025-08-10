# Random Joke Generator Component

A React Native component that fetches and displays random jokes, built for the Expo Native Component List showcase.

## Features

- **Random Joke Fetching**: Fetches jokes from the Official Joke API (`https://official-joke-api.appspot.com/random_joke`)
- **Loading States**: Shows proper loading indicator while fetching
- **Error Handling**: Graceful error handling with fallback jokes for offline mode
- **Clean UI**: Modern, card-based design with proper spacing and shadows
- **Cross-Platform**: Works on both React Native mobile and web platforms

## Usage

### In Native Component List

The Joke Generator is available in the Expo APIs section of the Native Component List app.

1. Navigate to the "Expo APIs" tab
2. Find "Joke Generator" in the list
3. Tap to open the component
4. Tap "Get Random Joke" to fetch and display a new joke

### Testing the Component

#### Online Mode
When internet is available, the component fetches jokes from the Official Joke API, providing fresh content each time.

#### Offline Mode 
When the API is unavailable (network issues, rate limiting, etc.), the component gracefully falls back to a set of predefined jokes to demonstrate functionality.

#### API Response Format
The component expects jokes in the following format:
```json
{
  "type": "general",
  "setup": "Why don't scientists trust atoms?",
  "punchline": "Because they make up everything!",
  "id": 1
}
```

## Implementation Details

### Key Features Implemented

1. **State Management**: Uses React hooks (`useState`) for managing joke data, loading, and error states
2. **HTTP Requests**: Uses the Fetch API for making HTTP requests to the jokes endpoint
3. **Error Boundaries**: Comprehensive error handling with user-friendly fallbacks
4. **TypeScript**: Fully typed interfaces for type safety
5. **Responsive Design**: Styled with React Native StyleSheet for consistent appearance

### File Structure

```
src/screens/JokeGeneratorScreen.tsx  # Main component file
src/navigation/ExpoApisStackNavigator.tsx  # Navigation configuration
```

### Dependencies

- React Native core components (`ScrollView`, `Text`, `View`, `StyleSheet`, `Alert`)
- Custom components from Native Component List (`Button`, `HeadingText`)
- Standard fetch API for HTTP requests

## Code Example

```typescript
// Basic usage pattern
const [state, setState] = useState<JokeState>({
  joke: null,
  loading: false,
  error: null,
});

const fetchRandomJoke = async () => {
  setState(prev => ({ ...prev, loading: true, error: null }));
  
  try {
    const response = await fetch('https://official-joke-api.appspot.com/random_joke');
    const joke: Joke = await response.json();
    setState({ joke, loading: false, error: null });
  } catch (error) {
    // Fallback to offline jokes
    setState({ joke: fallbackJoke, loading: false, error: null });
  }
};
```

## Future Enhancements

Potential improvements for the component:

1. **Joke Categories**: Add filtering by joke categories (programming, dad jokes, etc.)
2. **Favorites**: Allow users to save favorite jokes locally
3. **Share Functionality**: Add sharing capabilities for jokes
4. **Multiple APIs**: Support for multiple joke APIs as fallbacks
5. **Accessibility**: Enhanced accessibility features for screen readers

## Contributing

This component is part of the Expo monorepo. Follow the standard Expo contribution guidelines when making changes.