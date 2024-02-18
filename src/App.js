import React, { useEffect, useState } from 'react';
import './App.css';
import MapComponent from './MapComponent';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import alt_s3 from './alt_s3.json'
import DataContext from './DataContext';

function App() {

  const [mapData, setMapData] = useState(null);

  useEffect(() => {
    const resultMap = alt_s3.reduce((map, item) => {
      const lat = parseFloat(item.LATITUDE).toFixed(2);
      const lng = parseFloat(item.LONGITUD).toFixed(2);
      const key = `${lat}_${lng}`;
    
      if (map.has(key)) {
        const existingItem = map.get(key);
        existingItem.count += 1;
        existingItem.coords.push({ lat: item.LATITUDE, lng: item.LONGITUD });
      } else {
        map.set(key, { count: 1, coords: [{ lat: item.LATITUDE, lng: item.LONGITUD }] });
      }
    
      return map;
    }, new Map());
    
    setMapData(resultMap);
  }, [])

  return (
    <BrowserRouter>
      <div className="App">
        <DataContext.Provider value={{mapData: mapData}}>
        <Routes>
          <Route path="/" element={<MapComponent />} />
        </Routes>
        </DataContext.Provider>
      </div>
    </BrowserRouter>
  );
}

export default App;
