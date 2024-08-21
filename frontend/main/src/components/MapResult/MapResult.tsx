import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  APIProvider,
  Map,
  useMap,
  AdvancedMarker,
  MapCameraChangedEvent,
  Pin,
} from '@vis.gl/react-google-maps';
import axios from 'axios';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import type {Marker} from '@googlemaps/markerclusterer';
import {Circle} from './circle';

import JourneyTable from '../JourneyTable/JourneyTable.tsx';
import ImdDataTable from '../ImdDataTable/ImdDataTable.tsx';
import './MapResult.css';

type Poi = { key: string, location: google.maps.LatLngLiteral , is_primary_location: boolean}


const MapResult = ({ country, primaryLocation, journeys, locations, initBounds }) => {
    console.log(locations);
    console.log(country)
    if (country === "gb") {
      return (
        <APIProvider apiKey={process.env.GOOGLE_MAPS_API_KEY} region='GB' onLoad={() => console.log('Maps API Loaded')}>
          <div className="map-header">
            <a href={primaryLocation.maps_uri}>
              <h1>{primaryLocation.name}</h1>
            </a>
            <div className="map-address">
              {primaryLocation.address}
            </div>
          </div>
          <Map
            mapDiv='map-container'
            defaultBounds={{north: initBounds['north'], south: initBounds['south'], east: initBounds['east'], west: initBounds['west']}}
            mapId='1fc6d54c8b4d8b02'
            reuseMaps={true}
            onCameraChanged={(ev: MapCameraChangedEvent) => console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)}
          >
            <PoiMarkers pois={locations} />
          </Map>
          <div className="journey-table-container">
            <h1>Journey Table</h1>
            <JourneyTable journeys={journeys} />
          </div>
          <div className="imd-data-table-container">
            <h1>IMD Data</h1>
            <ImdDataTable primaryLocation={primaryLocation} />
          </div>
        </APIProvider>
      );
    }
    else {
      return (
        <APIProvider apiKey={process.env.GOOGLE_MAPS_API_KEY} region='GB' onLoad={() => console.log('Maps API Loaded')}>
          <div className="map-header">
            <a href={primaryLocation.maps_uri}>
              <h1>{primaryLocation.name}</h1>
            </a>
            <div className="map-address">
              {primaryLocation.address}
            </div>
          </div>
          <Map
            mapDiv='map-container'
            defaultBounds={{north: initBounds['north'], south: initBounds['south'], east: initBounds['east'], west: initBounds['west']}}
            mapId='1fc6d54c8b4d8b02'
            reuseMaps={true}
            onCameraChanged={(ev: MapCameraChangedEvent) => console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)}
          >
            <PoiMarkers pois={locations} />
          </Map>
          <div className="journey-table-container">
            <h1>Journey Table</h1>
            <JourneyTable journeys={journeys} />
          </div>
        </APIProvider>
      );
    }

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

  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({map});
    }
  }, [map]);

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
      {props.pois.map((poi: Poi) => (
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

export default MapResult;
