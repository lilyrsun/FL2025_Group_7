import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { GOOGLE_MAPS_API_KEY } from "@env";

type PlacePrediction = {
  placePrediction: {
    placeId: string;
    text: {
      text: string;
    };
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
};

const PickLocation: React.FC<PickLocationProps> = ({ selected, setSelected }) => {
  const [query, setQuery] = useState("");
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
      
      // 👇 unwrap into a cleaner array
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
    <View>
      <Text style={styles.label}>Pick a location for your event:</Text>

      <TextInput
        style={styles.input}
        placeholder="Search for an address"
        value={query}
        onChangeText={fetchPlaces}
      />

      {results.length > 0 && (
        <FlatList
        data={results}
        keyExtractor={(item) => item.placeId}
        style={styles.results}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultItem}
            onPress={() => selectPlace(item.placeId, item.description)}
          >
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
      )}

      {selected && (
        <Text style={styles.coords}>
          📍 {selected.address} {"\n"}
          Lat: {selected.lat}, Lng: {selected.lng}
        </Text>
      )}
    </View>
  );
};

export default PickLocation;

const styles = StyleSheet.create({
  label: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  results: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    maxHeight: 200,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  coords: { marginTop: 20, fontSize: 14, color: "#333" },
});