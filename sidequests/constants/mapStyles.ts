export const darkMode = [
  {
    elementType: "geometry",
    stylers: [{ color: "#120024" }], // deep indigo background
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#cdb4ff" }], // lavender labels
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0a0012" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#6a4c93" }], // muted purple roads
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#9d4edd" }], // brighter purple outline
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#4361ee" }], // vibrant royal blue water
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#3f37c9" }], // darker violet POIs
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#4cc9f0" }], // neon aqua grass/parks
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#7209b7" }], // electric purple transit lines
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b5179e" }], // magenta-leaning purple boundaries
  },
];

export const lightMode = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f0f4ff" }], // soft icy lavender background
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#5e60ce" }], // pastel indigo text
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#a3bffa" }], // light periwinkle roads
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d0d6f9" }], // pale lavender outline
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#90e0ef" }], // aqua-blue water
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#b5b9ff" }], // soft bluish-violet POIs
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#a9f0d1" }], // minty green-blue grass/parks
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#9d4edd" }], // lavender transit
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4361ee" }], // deep blue boundaries
  },
];