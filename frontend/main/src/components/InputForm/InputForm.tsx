import React, {useState, } from 'react';
import axios from 'axios';

import './InputForm.css'


type Poi = { key: string, location: google.maps.LatLngLiteral , is_primary_location: boolean}
type Journey = { origin: string, destination: string, destination_address: string, travel_time_mins: number}

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
        let destVals = [destValue];
        let totalDests = 1;
        const moreDestValuesList = moreDestValues.map(field => field.value);
        for (let i = 0; i < moreDestValuesList.length; i++) {
          if (moreDestValuesList[i] != '') {
            destVals.push(moreDestValuesList[i])
            totalDests += 1
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
          for (let i = 1; i <= totalDests; i++) {
            locations.push({key: origin_data[`dest${i}`]['name'], location: { lat: origin_data[`dest${i}`]['lat'], lng: origin_data[`dest${i}`]['lng']  }, is_primary_location: false});
            updateInitBounds(origin_data[`dest${i}`]['lat'], origin_data[`dest${i}`]['lng']);
            journeys.push({origin: origin_data['name'], destination: origin_data[`dest${i}`]['name'], destination_address: origin_data[`dest${i}`]['address'], travel_time_mins: origin_data[`dest${i}`]['travel_time_mins']});
          }
        };
        const primaryLocation = new Place(origins[0]['id'], origins[0]['name'], origins[0]['address'], origins[0]['lat'], origins[0]['lng'], origins[0]['raw_rank'], origins[0]['decile'], origins[0]['decile_stats'], origins[0]['maps_uri'])
        console.log(primaryLocation)
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

  export default InputForm;