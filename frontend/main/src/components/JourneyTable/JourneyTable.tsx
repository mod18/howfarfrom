import React from 'react';
import './JourneyTable.css';

const JourneyTable = ({ journeys }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Destination</th>
          <th>Address</th>
          <th colSpan="2">Travel Information</th>
        </tr>
      </thead>
      <tbody>
        {journeys.map((journey) => (
          <React.Fragment key={journey.destination}>
            <tr>
              <td>{journey.destination}</td>
              <td>{journey.destination_address}</td>
              <td colSpan="2">
                <div className="nested-table-container">
                  <table className="nested-table">
                    <tbody>
                      {journey.travel_modes.map((travel_mode, index) => (
                        <tr key={index}>
                          <td>{travel_mode.travel_mode}</td>
                          <td><a href={travel_mode.maps_uri} target="_blank" rel="noopener noreferrer">{travel_mode.travel_time_mins} minutes</a></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};

export default JourneyTable;
