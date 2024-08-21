import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import './InputForm.css';

type Poi = {
  key: string;
  location: google.maps.LatLngLiteral;
  is_primary_location: boolean;
};

type Journey = {
  origin: string;
  origin_address: string;
  destination: string;
  destination_address: string;
  travel_modes: Array<Map<string, string>>; // [{travel_mode: travel_mode, travel_time_mins: travel_time_mins, maps_uri: maps_uri}]
};

class Place {
  id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  raw_rank: string;
  decile: string;
  decile_stats: string;
  maps_uri: string;

  constructor(
    id: string,
    name: string,
    address: string,
    lat: string,
    lng: string,
    raw_rank: string,
    decile: string,
    decile_stats: string,
    maps_uri: string
  ) {
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

const locations: Poi[] = [];
const journeys: Journey[] = [];
const initBounds = { north: 0, south: 0, east: 0, west: 0 };

const updateInitBounds = (lat: number, lng: number) => {
  if (initBounds.north === 0) {
    initBounds.north = lat;
    initBounds.south = lat;
    initBounds.east = lng;
    initBounds.west = lng;
  } else {
    if (lat > initBounds.north) {
      initBounds.north = lat;
    }
    if (lat < initBounds.south) {
      initBounds.south = lat;
    }
    if (lng > initBounds.east) {
      initBounds.east = lng;
    }
    if (lng < initBounds.west) {
      initBounds.west = lng;
    }
  }
};

const InputForm = ({
  onSubmit,
}: {
  onSubmit: (data: { country: string; primaryLocation: Place; journeys: Journey[]; locations: Poi[]; initBounds: any }) => void;
}) => {
  const [originValue, setOriginValue] = useState('');
  const [originLoc, setOriginLoc] = useState('');
  const [moreDestValues, setMoreDestValues] = useState([{ value: '', travelModes: [] }]);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('us');

  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const existingScript = document.querySelector(`script[src="https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAutocomplete"]`);
      if (existingScript) {
        existingScript.remove();
      }
  
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places&callback=initAutocomplete`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };
  
    loadGoogleMapsScript();
  
    // @ts-ignore
    window.initAutocomplete = () => {
      if (originInputRef.current) {
        const options = {
          componentRestrictions: { country },
          fields: ['formatted_address', 'geometry', 'icon', 'name'],
          strictBounds: false,
        };
  
        const autocomplete = new google.maps.places.Autocomplete(originInputRef.current, options);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            setOriginValue(''.concat(place.name || '').concat(' ').concat(place.formatted_address || '') || '');
            const originLoc = {
              north: place.geometry.location?.lat() || 0,
              south: place.geometry.location?.lat() || 0,
              east: place.geometry.location?.lng() || 0,
              west: place.geometry.location?.lng() || 0,
            };
            setOriginLoc(originLoc);
          }
        });
      }
  
      moreDestValues.forEach((_, index) => {
        if (destinationInputRefs.current[index]) {
          const options = {
            componentRestrictions: { country },
            fields: ['formatted_address', 'geometry', 'icon', 'name'],
            strictBounds: false,
          };
  
          if (originLoc !== '') {
            options['bounds'] = originLoc;
          }
  
          const autocomplete = new google.maps.places.Autocomplete(destinationInputRefs.current[index]!, options);
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
              const newDestValues = [...moreDestValues];
              newDestValues[index].value = ''.concat(place.name || '').concat(' ').concat(place.formatted_address || '') || '';
              setMoreDestValues(newDestValues);
            }
          });
        }
      });
    };
  }, [moreDestValues, country]);
  

  const handleOriginChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOriginValue(event.target.value);
  };

  const handleMoreDestChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const newDestFields = [...moreDestValues];
    newDestFields[index].value = event.target.value;
    setMoreDestValues(newDestFields);
  };

  const handleTravelModeChange = (index: number, mode: string, event: React.ChangeEvent<HTMLInputElement>) => {
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
    setMoreDestValues([...moreDestValues, { value: '', travelModes: [] }]);
  };

  const handleCountryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCountry(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      let destVals: string[] = [];
      const moreDestValuesList = moreDestValues.map(field => [{ 'destination': field.value, 'travel_modes': field.travelModes }]);
      for (let i = 0; i < moreDestValuesList.length; i++) {
        if (moreDestValuesList[i] !== '') {
          destVals.push(moreDestValuesList[i]);
        }
      }
      let formMap = {};
      formMap[originValue] = destVals;
      console.log(JSON.stringify(formMap));
      const resp = await axios.get(
        `http://localhost:3000/cloud_api/get_distances/${JSON.stringify(formMap)}`
      );

      const origins: string[] = [];
      for (const key in resp.data['formatted_matrix']) {
        const origin_data = resp.data['formatted_matrix'][key];
        origins.push(origin_data);
        locations.push({
          key: origin_data['name'],
          location: { lat: origin_data['lat'], lng: origin_data['lng'] },
          is_primary_location: true,
        });
        updateInitBounds(origin_data['lat'], origin_data['lng']);
        for (let i = 1; i <= origin_data['num_journeys']; i++) {
          locations.push({
            key: origin_data[`dest${i}`]['name'],
            location: { lat: origin_data[`dest${i}`]['lat'], lng: origin_data[`dest${i}`]['lng'] },
            is_primary_location: false,
          });
          updateInitBounds(origin_data[`dest${i}`]['lat'], origin_data[`dest${i}`]['lng']);
          journeys.push({
            origin: origin_data['name'],
            origin_address: origin_data['address'],
            destination: origin_data[`dest${i}`]['name'],
            destination_address: origin_data[`dest${i}`]['address'],
            travel_modes: origin_data[`dest${i}`]['travel_modes'],
          });
        }
      }

      const primaryLocation = new Place(
        origins[0]['id'],
        origins[0]['name'],
        origins[0]['address'],
        origins[0]['lat'],
        origins[0]['lng'],
        origins[0]['raw_rank'],
        origins[0]['decile'],
        origins[0]['decile_stats'],
        origins[0]['maps_uri']
      );

      onSubmit({ country, primaryLocation, journeys, locations, initBounds });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="inputform-container" onSubmit={handleSubmit}>
          <div className="radio-group"> Where are you searching today?<br></br>
            <label>
              <input
                type="radio"
                name="country"
                value="us"
                checked={country === 'us'}
                onChange={handleCountryChange}
              />
              US
            </label>
            <label>
              <input
                type="radio"
                name="country"
                value="gb"
                checked={country === 'gb'}
                onChange={handleCountryChange}
              />
              UK
            </label>
        </div>
        <div>
          <label htmlFor="origin">Enter your starting address:</label>
          <input
            type="text"
            id="origin"
            value={originValue}
            onChange={handleOriginChange}
            ref={originInputRef}
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
              ref={(el) => (destinationInputRefs.current[index] = el)}
            />
            <div className="checkbox-group">
              {['walking', 'driving', 'transit'].map((mode) => (
                <label key={mode}>
                  <input
                    type="checkbox"
                    name={`travelMode${index}`}
                    value={mode}
                    checked={field.travelModes.includes(mode)}
                    onChange={(event) => handleTravelModeChange(index, mode, event)}
                  />{' '}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={handleAddDestField}>
          Add another?
        </button>
        <button type="submit">Submit</button>
        {loading && <p>Loading...</p>}
      </form>
    </>
  );
};

export default InputForm;
