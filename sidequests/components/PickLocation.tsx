import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  VirtualizedList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { GOOGLE_MAPS_API_KEY } from "@env";

type PlacePrediction = {
  placeId: string;
  text: {
    text: string;
  };
};

type Place = {
  placeId: string;
  description: string;
}

type Location = {
  address: string;
  lat: number;
  lng: number;
};

type PickLocationProps = {
  selected: Location | null;
  setSelected: React.Dispatch<React.SetStateAction<Location | null>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
};

const PickLocation: React.FC<PickLocationProps> = ({ selected, setSelected, query, setQuery }) => {
  const [results, setResults] = useState<Place[]>([]);

  const fetchPlaces = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        },
        body: JSON.stringify({ input: text }),
      });
      const json = await res.json();
      
      const predictions = (json.suggestions || []).map((p: any) => ({
        placeId: p.placePrediction.placeId,
        description: p.placePrediction.text?.text ?? "",
      }));

      setResults(predictions);
    } catch (err) {
      console.error("Places API error:", err);
    }
  }, []);

  const selectPlace = useCallback(async (placeId: string, description: string) => {
    try {
      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "id,displayName,location",
        },
      });
      const json = await res.json();
      if (json?.location) {
        setSelected({
          address: description,
          lat: json.location.latitude,
          lng: json.location.longitude,
        });
      }
      setResults([]);
      setQuery(description);
    } catch (err) {
      console.error("Place details error:", err);
    }
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
        style={styles.inputGradient}
      >
        <TextInput
          style={styles.input}
          placeholder="🗺️ Search for an address"
          placeholderTextColor="rgba(106, 90, 205, 0.6)"
          value={query}
          onChangeText={fetchPlaces}
        />
      </LinearGradient>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
            style={styles.resultsGradient}
          >
            <VirtualizedList
              data={results}
              keyExtractor={(item : Place) => item.placeId}
              style={styles.results}
              getItem={(data, index) => data[index]} // Default implementation
              getItemCount={(data) => data.length}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => selectPlace(item.placeId, item.description)}
                >
                  <Text style={styles.resultText}>📍 {item.description}</Text>
                </TouchableOpacity>
              )}
            />
          </LinearGradient>
        </View>
      )}

      {selected && (
        <View style={styles.selectedContainer}>
          <LinearGradient
            colors={['rgba(106, 90, 205, 0.2)', 'rgba(155, 89, 182, 0.1)']}
            style={styles.selectedGradient}
          >
            <Text style={styles.selectedText}>
              ✨ {selected.address}
            </Text>
            <Text style={styles.coordsText}>
              📍 Lat: {selected.lat.toFixed(10)}, Long: {selected.lng.toFixed(10)}
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

export default PickLocation;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  inputGradient: {
    borderRadius: 16,
    padding: 2,
  },
  input: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    color: '#6a5acd',
    fontWeight: '500',
  },
  resultsContainer: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6a5acd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  resultsGradient: {
    borderRadius: 16,
    padding: 2,
    maxHeight: 200,
  },
  results: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    maxHeight: 196,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(106, 90, 205, 0.1)',
  },
  resultText: {
    fontSize: 15,
    color: '#6a5acd',
    fontWeight: '500',
  },
  selectedContainer: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedGradient: {
    borderRadius: 16,
    padding: 16,
  },
  selectedText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});