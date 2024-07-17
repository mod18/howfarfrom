import React from 'react';

import './JourneyTable.css'

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
 export default JourneyTable;