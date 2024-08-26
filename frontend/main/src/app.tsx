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
import Header from './components/Header/Header.tsx';
import InputForm from './components/InputForm/InputForm.tsx';
import MapResult from './components/MapResult/MapResult.tsx';
import Footer from './components/Footer/Footer.tsx';


const App = () => {
  const [country, setCountry] = useState(null);
  const [primaryLocation, setPrimaryLocation] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [locations, setLocations] = useState([]);
  const [initBounds, setInitBounds] = useState(null);

  const handleFormSubmit = async ({ country, primaryLocation, journeys, locations, initBounds }) => {
    setCountry(country);
    setPrimaryLocation(primaryLocation);
    setJourneys(journeys);
    setLocations(locations);
    setInitBounds(initBounds);
  };

  return (
    <div class="middle-container">
        <div class="header">
            <Header title="HowFarFrom" />
        </div>
        <div class="inner-container">
            {primaryLocation === null ? (
                <InputForm onSubmit={handleFormSubmit} />
            ) : (
                <MapResult
                    country={country}
                    primaryLocation={primaryLocation}
                    journeys={journeys}
                    locations={locations}
                    initBounds={initBounds}
                />
            )}
        </div>
        <div class="footer"><Footer></Footer></div>
    </div>

  )
};

  
const root = createRoot(document.getElementById('app'));
root.render(<App />)
export default App;
