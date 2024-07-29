import React, {useState, } from 'react';
import axios from 'axios';

import './InputForm.css'


type Poi = { key: string, location: google.maps.LatLngLiteral , is_primary_location: boolean}
type Journey = { origin: string, origin_address: string, destination: string, destination_address: string, travel_mode: string, travel_time_mins: number, maps_uri: string}

class Place { id: string; name: string; address: string; lat: string; lng: string; raw_rank: string; decile: string; decile_stats: string; maps_uri: string;
  constructor(id, name, address, lat, lng, raw_rank, decile, decile_stats, maps_uri) {
    this.id = id;
    this.name = name; 
    this.address = address;
    this.lat = lat;
    this.lng = lng; 
    this.raw_rank = raw_rank;
    this.decile = decile;
    this.decile_stats = decile_stats;
    this.maps_uri = maps_uri;
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

const buildMapsRef = (origin, destination) => {
  const encOrigin = encodeURIComponent(origin)
  const encDestination = encodeURIComponent(destination)
  return `https://google.com/maps/dir/${encOrigin}/${encDestination}`
};

const InputForm = ({ onSubmit }) => {
    // Declare a state variable to hold the input value
    const [originValue, setOriginValue] = useState('');
    const [moreDestValues, setMoreDestValues] = useState([{ value: '', travelModes: []}]);
    const [loading, setLoading] = useState(false); 
  
    // Handle input changes
    const handleOriginChange = (event) => {
      setOriginValue(event.target.value);
    };
    const handleMoreDestChange = (index, event) => {
      const newDestFields = [...moreDestValues];
      newDestFields[index].value = event.target.value;
      setMoreDestValues(newDestFields);
    };
    const handleTravelModeChange = (index, mode, event) => {
      const newDestFields = [...moreDestValues];
      if (event.target.checked) {
        newDestFields[index].travelModes.push(mode);
      } else {
        const modeIndex = newDestFields[index].travelModes.indexOf(mode);
        if (modeIndex > -1) {
          newDestFields[index].travelModes.splice(modeIndex, 1);
        }
      }
      setMoreDestValues(newDestFields);
    };
    const handleAddDestField = () => {
      setMoreDestValues([...moreDestValues, { value: '', travelModes: []}]);
    };
  
    // Handle form submission
    const handleSubmit = async (event) => {
      event.preventDefault();
      console.log('Form Values:', {originValue, moreDestValues});
      setLoading(true)
      try {
        let destVals: string[] = [];
        const moreDestValuesList = moreDestValues.map(field => [{'destination': field.value, 'travel_modes': field.travelModes}]);
        for (let i = 0; i < moreDestValuesList.length; i++) {
          if (moreDestValuesList[i] != '') {
            destVals.push(moreDestValuesList[i])
          };
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
          for (let i = 1; i <= origin_data['num_journeys']; i++) {
            locations.push({key: origin_data[`dest${i}`]['name'], location: { lat: origin_data[`dest${i}`]['lat'], lng: origin_data[`dest${i}`]['lng']  }, is_primary_location: false});
            updateInitBounds(origin_data[`dest${i}`]['lat'], origin_data[`dest${i}`]['lng']);
            const mapsUri = buildMapsRef(origin_data['address'], origin_data[`dest${i}`]['address']);
            journeys.push({origin: origin_data['name'], origin_address: origin_data['address'], destination: origin_data[`dest${i}`]['name'], destination_address: origin_data[`dest${i}`]['address'], travel_mode: origin_data[`dest${i}`]['travel_mode'], travel_time_mins: origin_data[`dest${i}`]['travel_time_mins'], maps_uri: mapsUri});
          }
        };
        const primaryLocation = new Place(origins[0]['id'], origins[0]['name'], origins[0]['address'], origins[0]['lat'], origins[0]['lng'], origins[0]['raw_rank'], origins[0]['decile'], origins[0]['decile_stats'], origins[0]['maps_uri'])
        console.log(primaryLocation)
        console.log(journeys)
        onSubmit({ primaryLocation, journeys, locations, initBounds });
  
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <form className="inputform-container" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="origin">Enter your starting address:</label>
        <input
          type="text"
          id="origin"
          value={originValue}
          onChange={handleOriginChange}
        />
      </div>
      {moreDestValues.map((field, index) => (
        <div key={index} className="form-group">
          <label htmlFor={`additionalDest${index}`}>Enter a destination:</label>
          <input
            type="text"
            id={`additionalDest${index}`}
            value={field.value}
            onChange={(event) => handleMoreDestChange(index, event)}
          />
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name={`travelMode${index}`}
                value="walking"
                checked={field.travelModes.includes('walking')}
                onChange={(event) => handleTravelModeChange(index, 'walking', event)}
              /> Walking
            </label>
            <label>
              <input
                type="checkbox"
                name={`travelMode${index}`}
                value="driving"
                checked={field.travelModes.includes('driving')}
                onChange={(event) => handleTravelModeChange(index, 'driving', event)}
              /> Driving
            </label>
            <label>
              <input
                type="checkbox"
                name={`travelMode${index}`}
                value="transit"
                checked={field.travelModes.includes('transit')}
                onChange={(event) => handleTravelModeChange(index, 'transit', event)}
              /> Transit
            </label>
          </div>
        </div>
      ))}
      <button type="button" onClick={handleAddDestField}>Add another?</button>
      <button type="submit">Submit</button>
      {loading && <p>Loading...</p>}
    </form>
    );
  };

  export default InputForm;