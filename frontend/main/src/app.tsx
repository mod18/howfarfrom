import React, {useEffect, useState, useRef, useCallback} from 'react';
import {createRoot} from "react-dom/client";
import {
    APIProvider,
    Map,
    useMap,
    AdvancedMarker,
    MapCameraChangedEvent,
    Pin,
  } from '@vis.gl/react-google-maps';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import type {Marker} from '@googlemaps/markerclusterer';
import {Circle} from './components/MapResult/circle.tsx';
import axios from 'axios';

import '../styles.css';
import InputForm from './components/InputForm/InputForm.tsx';
import MapResult from './components/MapResult/MapResult.tsx';


const App = () => {
  const [primaryLocation, setPrimaryLocation] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [locations, setLocations] = useState([]);
  const [initBounds, setInitBounds] = useState(null);

  const handleFormSubmit = async ({ primaryLocation, journeys, locations, initBounds }) => {
    setPrimaryLocation(primaryLocation);
    setJourneys(journeys);
    setLocations(locations);
    setInitBounds(initBounds);
  };

  return (
    <div id='map-container'>
      <h1>HowFarFrom</h1>
      {primaryLocation === null ? (
        <InputForm onSubmit={handleFormSubmit} />
      ) : (
        <MapResult primaryLocation={primaryLocation} journeys={journeys} locations={locations} initBounds={initBounds} />
      )}
    </div>
  )
};

  
const root = createRoot(document.getElementById('app'));
root.render(<App />)
export default App;
