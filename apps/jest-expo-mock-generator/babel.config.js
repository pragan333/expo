import React, { useState } from 'react';
import { View, Text, Picker, FlatList, StyleSheet } from 'react-native';

const issues = {
  "No Fluoroscopy Output": [
    "Check tube filament resistance",
    "Review error logs on GUI",
    "Test generator high voltage output"
  ],
  "Detector Not Initializing": [
    "Check power supply LED indicators",
    "Reseat detector cable",
    "Access engineering menu > Detector Status"
  ],
  "DAP Missing": [
    "Verify DAP sensor cabling",
    "Replace sensor if no signal",
    "Check software config and DICOM tag"
  ],
  "Image Artifact": [
    "Run calibration in engineering mode",
    "Inspect grid alignment",
    "Check for dead pixels or aging"
  ],
  "HIB Board Fault": [
    "Measure input/output voltages",
    "Visually inspect capacitors and fuses",
    "Replace board if shorted or damaged"
  ]
};

const App = () => {
  const [selectedIssue, setSelectedIssue] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.header}>FD10 Diagnostic Assistant</Text>
      <Picker
        selectedValue={selectedIssue}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedIssue(itemValue)}
      >
        <Picker.Item label="Select an issue..." value="" />
        {Object.keys(issues).map((key) => (
          <Picker.Item key={key} label={key} value={key} />
        ))}
      </Picker>

      {selectedIssue ? (
        <FlatList
          data={issues[selectedIssue]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <Text style={styles.item}>• {item}</Text>}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  picker: { height: 50, width: '100%' },
  item: { fontSize: 16, marginVertical: 5 }
});

export default App;
