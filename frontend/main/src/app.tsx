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
import {Circle} from './components/circle';
import axios from 'axios';

import '../styles.css';


type Poi = { key: string, location: google.maps.LatLngLiteral , is_primary_location: boolean}
type Journey = { origin: string, destination: string, destination_address: string, travel_time_mins: number}

class Place { id: string; name: string; lat: string; lng: string
  constructor(id, name, lat, lng) {
    this.id = id;
    this.name = name; 
    this.lat = lat;
    this.lng = lng; 
    }
  } 

const locations: Poi[] = [
  // {key: 'operaHouse', location: { lat: -33.8567844, lng: 151.213108  }}
];
const journeys: Journey[] = [];
const initBounds = {'north': 0, 'south': 0, 'east': 0, 'west': 0}

const updateInitBounds = (lat: number, lng: number) => {
  if (initBounds['north'] == 0) {
    initBounds['north'] = lat
    initBounds['south'] = lat
    initBounds['east'] = lng
    initBounds['west'] = lng
  }
  else {
    if (lat > initBounds['north']) {
      initBounds['north'] = lat
    }
    if (lat < initBounds['south']) {
      initBounds['south'] = lat
    }
    if (lng > initBounds['east']) {
      initBounds['east'] = lng
    }
    if (lng < initBounds['west']) {
      initBounds['west'] = lng
    }
  }
};

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
        <MapResult primaryLocation={primaryLocation} journeys={journeys} />
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

      let origins: string[] = [];
      for (const key in resp.data['formatted_matrix']) {
        let origin_data = resp.data['formatted_matrix'][key]
        origins.push(origin_data)
        locations.push({key: origin_data['name'], location: { lat: origin_data['lat'], lng: origin_data['lng']  }, is_primary_location: true})
        updateInitBounds(origin_data['lat'], origin_data['lng']);
        // load origin and destinations into locations for map
        for (let i = 1; i <= 1 + moreDestValuesList.length; i++) {
          locations.push({key: origin_data[`dest${i}`]['name'], location: { lat: origin_data[`dest${i}`]['lat'], lng: origin_data[`dest${i}`]['lng']  }, is_primary_location: false});
          updateInitBounds(origin_data[`dest${i}`]['lat'], origin_data[`dest${i}`]['lng']);
          journeys.push({origin: origin_data['name'], destination: origin_data[`dest${i}`]['name'], destination_address: origin_data[`dest${i}`]['address'], travel_time_mins: origin_data[`dest${i}`]['travel_time_mins']});
        }
      };
      const primaryLocation = new Place(origins[0]['id'], origins[0]['name'], origins[0]['lat'], origins[0]['lng'])
      onSubmit(primaryLocation, journeys);

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

const JourneyTable = ({ journeys }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Destination</th>
          <th>Address</th>
          <th>Travel Time (Minutes)</th>
        </tr>
      </thead>
      <tbody>
        {journeys.map((journey) => (
            <tr key={journey.destination}>
            <td>{journey.destination}</td>
            <td>{journey.destination_address}</td>
            <td>{journey.travel_time_mins}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const MapResult = ( {primaryLocation, journeys} ) => {
  console.log(locations)
    return (
    // TODO: Move this to backend API call; Customize region based on primaryLocation
    <APIProvider apiKey={""} region='GB' onLoad={() => console.log('Maps API has loaded.')}>
         <Map
            mapDiv='map-container'
            // defaultZoom={13}
            // defaultCenter={ { lat: primaryLocation.lat, lng: primaryLocation.lng } }
            defaultBounds={ {north: initBounds['north'], south: initBounds['south'], east: initBounds['east'], west: initBounds['west']} }
            // TODO: Customize map style https://developers.google.com/maps/documentation/get-map-id
            mapId='1fc6d54c8b4d8b02'
            reuseMaps={true}
            onCameraChanged={ (ev: MapCameraChangedEvent) =>
                console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
            }>
            <PoiMarkers pois={locations} />
        </Map>
        <h1>{primaryLocation.name}</h1>
        <div>
          <h1>Journey Table</h1>
          <JourneyTable journeys={journeys} />
        </div>
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
          {poi.is_primary_location ? (
            <Pin background="#FBBC04" glyphColor="#000" borderColor="#000" />
          ) : (
            <Pin background="#FB1A04" glyphColor="#000" borderColor="#000" />
          )}
          </AdvancedMarker>
        ))}
      </>
    );
  };
  
  

const root = createRoot(document.getElementById('app'));
root.render(<App />)
export default App;
