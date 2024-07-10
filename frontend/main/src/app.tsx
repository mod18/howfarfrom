import React, {useEffect, useState, useRef, useCallback} from 'react';
import {createRoot} from "react-dom/client";
import {
    APIProvider,
    Map,
    useMap,
    AdvancedMarker,
    MapCameraChangedEvent,
    Pin
  } from '@vis.gl/react-google-maps';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import type {Marker} from '@googlemaps/markerclusterer';
import {Circle} from './components/circle';
import axios from 'axios';

import '../styles.css';


type Poi = { key: string, location: google.maps.LatLngLiteral }

class Place { id: string; name: string; lat: string; lng: string
  constructor(id, name, lat, lng) {
    this.id = id;
    this.name = name; 
    this.lat = lat;
    this.lng = lng; 
    }
  } 

const locations: Poi[] = [
  {key: 'operaHouse', location: { lat: -33.8567844, lng: 151.213108  }},
  {key: 'tarongaZoo', location: { lat: -33.8472767, lng: 151.2188164 }},
  {key: 'manlyBeach', location: { lat: -33.8209738, lng: 151.2563253 }},
  {key: 'hyderPark', location: { lat: -33.8690081, lng: 151.2052393 }},
  {key: 'theRocks', location: { lat: -33.8587568, lng: 151.2058246 }},
  {key: 'circularQuay', location: { lat: -33.858761, lng: 151.2055688 }},
  {key: 'harbourBridge', location: { lat: -33.852228, lng: 151.2038374 }},
  {key: 'kingsCross', location: { lat: -33.8737375, lng: 151.222569 }},
  {key: 'botanicGardens', location: { lat: -33.864167, lng: 151.216387 }},
  {key: 'museumOfSydney', location: { lat: -33.8636005, lng: 151.2092542 }},
  {key: 'maritimeMuseum', location: { lat: -33.869395, lng: 151.198648 }},
  {key: 'kingStreetWharf', location: { lat: -33.8665445, lng: 151.1989808 }},
  {key: 'aquarium', location: { lat: -33.869627, lng: 151.202146 }},
  {key: 'darlingHarbour', location: { lat: -33.87488, lng: 151.1987113 }},
  {key: 'barangaroo', location: { lat: - 33.8605523, lng: 151.1972205 }},
];

const App = () => {
  const [primaryLocation, setprimaryLocation] = useState(null);

  const handleFormSubmit = async (primaryLocation) => {
    setprimaryLocation(primaryLocation);
  };

  return (
    <div id='map-container'>
      <h1>HowFarFrom</h1>
      {primaryLocation === null ? (
        <InputForm onSubmit={handleFormSubmit} />
      ) : (
        <MapResult primaryLocation={primaryLocation} />
      )}
    </div>
  )
};

const InputForm = ({ onSubmit }) => {
  // Declare a state variable to hold the input value
  const [originValue, setOriginValue] = useState('');
  const [destValue, setDestValue] = useState('');
  const [moreDestValues, setMoreDestValues] = useState([{ value: ''}]);
  const [loading, setLoading] = useState(false); 

  // Handle input changes
  const handleOriginChange = (event) => {
    setOriginValue(event.target.value);
  };
  const handleDestChange = (event) => {
    setDestValue(event.target.value);
  };
  const handleMoreDestChange = (index, event) => {
    const newDestFields = [...moreDestValues];
    newDestFields[index].value = event.target.value;
    setMoreDestValues(newDestFields);
  };

  const handleAddDestField = () => {
    setMoreDestValues([...moreDestValues, { value: ''}]);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log('Form Values:', {originValue, destValue, moreDestValues});
    setLoading(true)
    try {
      let destVals = [destValue]
      const moreDestValuesList = moreDestValues.map(field => field.value);
      for (let i = 0; i < moreDestValuesList.length; i++) {
        destVals.push(moreDestValuesList[i]);
      }
      let formMap = {};
      formMap[originValue] = destVals;
      console.log(JSON.stringify(formMap));
      const resp = await axios.get(`http://localhost:3000/cloud_api/get_distances/${JSON.stringify(formMap)}`);
      console.log(resp.data);

      // const parsedResp = JSON.parse(resp.data);

      let origins: string[] = [];
      for (const key in resp.data['formatted_matrix']) {
        origins.push(resp.data['formatted_matrix'][key])
      };
      console.log(origins)
      const primaryLocation = new Place(origins[0]['id'], origins[0]['name'], origins[0]['lat'], origins[0]['lng'])
      onSubmit(primaryLocation);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="origin">Enter your starting address:</label>
        <input
          type="text"
          id="origin"
          value={originValue}
          onChange={handleOriginChange}
        />
      </div>
      <div>
        <label htmlFor="origin">Enter a destination or point of interest:</label>
        <input
          type="text"
          id="dest"
          value={destValue}
          onChange={handleDestChange}
        />
      </div>
      {moreDestValues.map((field, index) => (
        <div key={index}>
          <label htmlFor={`additionalDest${index}`}>Enter another destination:</label>
          <input
            type="text"
            id={`additionalDest${index}`}
            value={field.value}
            onChange={(event) => handleMoreDestChange(index, event)}
          />
        </div>
      ))}
      <button type="button" onClick={handleAddDestField}>Add another?</button>
      <button type="submit">Submit</button>
      {loading && <p>Loading...</p>}
    </form>
  );
};

const MapResult = ( {primaryLocation} ) => {
    return (
    // TODO: Move this to backend API call
    <APIProvider apiKey={""} onLoad={() => console.log('Maps API has loaded.')}>
         <Map
            mapDiv='map-container'
            defaultZoom={13}
            defaultCenter={ { lat: primaryLocation.lat, lng: primaryLocation.lng } }
            // TODO: Customize map style https://developers.google.com/maps/documentation/get-map-id
            mapId='1fc6d54c8b4d8b02'
            onCameraChanged={ (ev: MapCameraChangedEvent) =>
                console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
            }>
            <PoiMarkers pois={locations} />
        </Map>
        <h1>{primaryLocation.name}</h1>
    </APIProvider>
    )
};

const PoiMarkers = (props: { pois: Poi[] }) => {
    const map = useMap();
    const [markers, setMarkers] = useState<{[key: string]: Marker}>({});
    const clusterer = useRef<MarkerClusterer | null>(null);
    const [circleCenter, setCircleCenter] = useState(null);
    const handleClick = useCallback((ev: google.maps.MapMouseEvent) => {
        if(!map) return;
        if(!ev.latLng) return;
        console.log('marker clicked:', ev.latLng.toString());
        map.panTo(ev.latLng);
        setCircleCenter(ev.latLng);
     });


    // Initialize MarkerClusterer, if the map has changed
    useEffect(() => {
      if (!map) return;
      if (!clusterer.current) {
        clusterer.current = new MarkerClusterer({map});
      }
    }, [map]);
  
    // Update markers, if the markers array has changed
    useEffect(() => {
      clusterer.current?.clearMarkers();
      clusterer.current?.addMarkers(Object.values(markers));
    }, [markers]);
  
    const setMarkerRef = (marker: Marker | null, key: string) => {
      if (marker && markers[key]) return;
      if (!marker && !markers[key]) return;
  
      setMarkers(prev => {
        if (marker) {
          return {...prev, [key]: marker};
        } else {
          const newMarkers = {...prev};
          delete newMarkers[key];
          return newMarkers;
        }
      });
    };
  
    return (
      <>
        <Circle
          radius={800}
          center={circleCenter}
          strokeColor={'#0c4cb3'}
          strokeOpacity={1}
          strokeWeight={3}
          fillColor={'#3b82f6'}
          fillOpacity={0.3}
        />
        {props.pois.map( (poi: Poi) => (
          <AdvancedMarker
            key={poi.key}
            position={poi.location}
            ref={marker => setMarkerRef(marker, poi.key)}
            clickable={true}
            onClick={handleClick}
            >
              <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
          </AdvancedMarker>
        ))}
      </>
    );
  };
  
  

const root = createRoot(document.getElementById('app'));
root.render(<App />)
export default App;
