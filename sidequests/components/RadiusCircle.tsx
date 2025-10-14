import React from "react";
import { Circle } from "react-native-maps";

type RadiusCircleProps = {
  location: { latitude: number; longitude: number };
  radiusMi: number;
};

export const RadiusCircle: React.FC<RadiusCircleProps> = ({
  location,
  radiusMi,
}) => {
  if (!location) return null;

  // react-native-maps Circle expects radius in meters
  const radiusMeters = radiusMi * 1609.34;

  return (
    <Circle
      center={location}
      radius={radiusMeters}
      strokeColor="rgba(0, 122, 255, 0.7)"
      fillColor="rgba(0, 122, 255, 0.01)"
      strokeWidth={2}
    />
  );
};