import React from 'react';
import './ImdDataTable.css';

const ImdDataTable = ({ primaryLocation }) => {
    return (
      <table>
        <thead>
          <tr>
            <th>Raw Rank</th>
            <th>IMD Decile</th>
            <th>IMD Decile Stats</th>
          </tr>
        </thead>
        <tbody>
            <tr key={primaryLocation.name}>
            <td>{primaryLocation.raw_rank}</td>
            <td>{primaryLocation.decile}</td>
            <td>{primaryLocation.decile_stats}</td>
            </tr>
        </tbody>
      </table>
    );
  };

export default ImdDataTable;