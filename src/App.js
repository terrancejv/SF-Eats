import React, { useState, useEffect } from 'react';
import ReactMapGL, { Marker, Popup } from 'react-map-gl';
import './App.css';
import { GiPositionMarker } from 'react-icons/gi';
import "mapbox-gl/dist/mapbox-gl.css"
import mapboxgl from 'mapbox-gl';
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

const App = () => {
  const [viewport, setViewport] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 11,
  });

  const [foodTrucks, setFoodTrucks] = useState([]);
  const [selectedFoodTruck, setSelectedFoodTruck] = useState(null);
  const [showMarkers, setShowMarkers] = useState(false); // State for showing/hiding markers
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isEmptyResults, setIsEmptyResults] = useState('');

  let delayTimer;

  const isCoordinateInSanFrancisco = (latitude, longitude) => {
    // Define the boundaries of San Francisco
    const minLatitude = 37.6;
    const maxLatitude = 37.9;
    const minLongitude = -123.1;
    const maxLongitude = -122.3;
  
    // Check if the coordinate falls within the boundaries
    return (
      latitude >= minLatitude &&
      latitude <= maxLatitude &&
      longitude >= minLongitude &&
      longitude <= maxLongitude
    );
  };

  useEffect(() => {
    fetch('https://data.sfgov.org/resource/rqzj-sfat.json')
      .then((response) => response.json())
      .then((data) => {
        // Filter out invalid coordinates and missing properties
        const filteredData = data.filter((truck) =>
            isCoordinateInSanFrancisco(parseFloat(truck.latitude), parseFloat(truck.longitude)) &&
            truck.latitude &&
            truck.longitude &&
            !isNaN(truck.latitude) &&
            !isNaN(truck.longitude) &&
            truck.objectid &&
            truck.applicant &&
            truck.fooditems
            
        );
        setFoodTrucks(filteredData);
      })
      .catch((error) => {
        console.error('Error occurred while fetching data:', error);
      });
  }, []);

  useEffect(() => {
    // Filter food trucks based on search term
    const results = foodTrucks.filter((truck) =>
      truck.applicant.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  }, [foodTrucks, searchTerm]);

  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);

    clearTimeout(delayTimer);

    delayTimer = setTimeout(() => {
      // Code to be executed after 0 seconds
      const searchTerm = event.target.value.toLowerCase();
      const filteredFoodTrucks = foodTrucks.filter((foodTruck) => {
        const applicant = foodTruck.applicant || '';
        const fooditems = foodTruck.fooditems || '';
        const facilitytype = foodTruck.facilitytype || '';
        const status = foodTruck.status || '';
        return (
          applicant.toLowerCase().includes(searchTerm) ||
          fooditems.toLowerCase().includes(searchTerm) ||
          facilitytype.toLowerCase().includes(searchTerm) ||
          status.toLowerCase().includes(searchTerm)
        );
      });
      if (filteredFoodTrucks.length === 0) {
        setSearchResults([]);
        setIsEmptyResults(true);
      } else {
        setSearchResults(filteredFoodTrucks);
        setIsEmptyResults(false);
      }
    }, 0);
  };
  
  
  const handleMarkerClick = (foodTruck) => {
    if (foodTruck) {
      setSelectedFoodTruck(foodTruck);
    }
  };

  const handleButtonToggle = () => {
    setShowMarkers(!showMarkers); // Toggle showMarkers state
  };

  const handleMoveToLocation = (foodTruck) => {
    if (foodTruck) {
      setViewport({
        ...viewport,
        latitude: parseFloat(foodTruck.latitude),
        longitude: parseFloat(foodTruck.longitude),
      });
      setSelectedFoodTruck(foodTruck);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh"}}>
      <ReactMapGL
        {...viewport}
        /* Added URL restrictions so no need to do process.env.REACT_APP_MAP_TOKEN */
        mapboxAccessToken='pk.eyJ1IjoidGVycmFuY2VqdiIsImEiOiJjbGhxczJiM2MyaWhjM2Vxa3hjMHF1bWZ2In0.BDXH4CwbZ5gf9AzQHx8PeA'
        width="100%"
        height="100%"
        transitionDuration="200"
        mapStyle="mapbox://styles/mapbox/navigation-night-v1"
        onMove={evt => setViewport(evt.viewport)}
      >
        <p className='page-title'>Food Truck Finder (San Francisco, California)</p>
        <div class="search-bar">
          <input type="text" placeholder="i.e. name, genre, type..." value={searchTerm} onChange={handleSearch}/>
          <button className="show-all-button" onClick={handleButtonToggle}>Show All</button> {/* Button to show/hide markers */}
        </div>
        {searchTerm && (
          <div className="search-results">
            {isEmptyResults && <p>No Results</p>}
            {foodTrucks.length > 0 &&
              searchResults.map((foodTruck, index) => (
                <div key={foodTruck.objectid} className="foodtruck-item">
                  <div className='foodtruck-details'>
                    <h3 className='applicant'>{`${index + 1}. ${foodTruck.applicant}`}</h3>
                    <p className='address'>{foodTruck.address}</p>
                </div>
                <button
                  className="go-btn"
                  onClick={() => handleMoveToLocation(foodTruck)}
                  >
                  Go
                </button>
              </div>
            ))}
          </div>
        )}

        {showMarkers && // Render markers only if showMarkers is true
          searchResults.length > 0 && // Check if foodTrucks array has data
          searchResults.map((foodTruck) => (
            <Marker
              key={foodTruck.objectid}
              latitude={parseFloat(foodTruck.latitude)}
              longitude={parseFloat(foodTruck.longitude)}
            >
              <button
                className="marker-btn"
                onClick={() => handleMarkerClick(foodTruck)}
              >
                <GiPositionMarker className="foodtruck-icon" alt="Food Truck" /> 
              </button>
            </Marker>
        ))}

        {selectedFoodTruck && (
          <Popup
            latitude={parseFloat(selectedFoodTruck.latitude)}
            longitude={parseFloat(selectedFoodTruck.longitude)}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedFoodTruck(null)}
          >
            <div>
              <h2>{selectedFoodTruck.applicant}</h2>
              <p>Permit({selectedFoodTruck.permit}): {selectedFoodTruck.status}</p>
              <h3>{selectedFoodTruck.facilitytype} At: {selectedFoodTruck.address}</h3>
              <p>
               Food - {selectedFoodTruck.fooditems.replace(/:|;/g, ',')}
              </p>
            </div>
          </Popup>
        )}
      </ReactMapGL>
    </div>
  );
};

export default App;
