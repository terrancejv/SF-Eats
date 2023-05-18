import React, { useState, useEffect } from 'react';
import ReactMapGL, { Marker, Popup } from 'react-map-gl';
import './App.css';
import { GiPositionMarker } from 'react-icons/gi';
import { TbCircleFilled } from 'react-icons/tb';
import "mapbox-gl/dist/mapbox-gl.css"
import mapboxgl from 'mapbox-gl';
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default;

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371; // Radius of the Earth in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  return distance;
}

// Convert degrees to radians
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function filterFoodTrucks(foodTrucks, searchTerm, searchRadius) {
  return foodTrucks.filter((foodTruck) => {
    const applicant = foodTruck.applicant || '';
    const fooditems = foodTruck.fooditems || '';
    const facilitytype = foodTruck.facilitytype || '';
    const status = foodTruck.status || '';
    const distance = foodTruck.distance || '';
    return (
      applicant.toLowerCase().includes(searchTerm) ||
      fooditems.toLowerCase().includes(searchTerm) ||
      facilitytype.toLowerCase().includes(searchTerm) ||
      status.toLowerCase().includes(searchTerm) ||
      distance <= searchRadius
    );
  });
}

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
  const [userLatitude, setUserLatitude] = useState(0);
  const [userLongitude, setUserLongitude] = useState(0);
  const [addressInput, setAddressInput] = useState('');
  const [searchRadius, setSearchRadius] = useState(10);

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
      const filteredFoodTrucks = filterFoodTrucks(foodTrucks, searchTerm, searchRadius);
      if (filteredFoodTrucks.length === 0) {
        setSearchResults([]);
        setIsEmptyResults(true);
      } else {
        setSearchResults(filteredFoodTrucks);
        setIsEmptyResults(false);
      }
    }, 500);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      addressInput
    )}&key=AIzaSyDPor6dzCNbVv_2JHxh4WjWHSmpAfb8Pw8`;

    fetch(geocodingUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'OK' && data.results.length > 0) {
          const latitude = data.results[0].geometry.location.lat;
          const longitude = data.results[0].geometry.location.lng;
          setUserLatitude(latitude);
          setUserLongitude(longitude);

          if (isCoordinateInSanFrancisco(parseFloat(latitude), parseFloat(longitude)))
          {
            fetch(
            'https://data.sfgov.org/resource/rqzj-sfat.json?$query=SELECT%0A%20%20%60objectid%60%2C%0A%20%20%60applicant%60%2C%0A%20%20%60facilitytype%60%2C%0A%20%20%60cnn%60%2C%0A%20%20%60locationdescription%60%2C%0A%20%20%60address%60%2C%0A%20%20%60blocklot%60%2C%0A%20%20%60block%60%2C%0A%20%20%60lot%60%2C%0A%20%20%60permit%60%2C%0A%20%20%60status%60%2C%0A%20%20%60fooditems%60%2C%0A%20%20%60x%60%2C%0A%20%20%60y%60%2C%0A%20%20%60latitude%60%2C%0A%20%20%60longitude%60%2C%0A%20%20%60schedule%60%2C%0A%20%20%60dayshours%60%2C%0A%20%20%60noisent%60%2C%0A%20%20%60approved%60%2C%0A%20%20%60received%60%2C%0A%20%20%60priorpermit%60%2C%0A%20%20%60expirationdate%60%2C%0A%20%20%60location%60%2C%0A%20%20%60%3A%40computed_region_yftq_j783%60%2C%0A%20%20%60%3A%40computed_region_p5aj_wyqh%60%2C%0A%20%20%60%3A%40computed_region_rxqg_mtj9%60%2C%0A%20%20%60%3A%40computed_region_bh8s_q3mv%60%2C%0A%20%20%60%3A%40computed_region_fyvs_ahh9%60'
            )
              .then((response) => response.json())
              .then((data) => {
                const distanceThreshold = searchRadius; // Consider food trucks within searchRadius
                const filteredFoodTrucks = filterFoodTrucks(data, searchTerm);
                const closeFoodTrucks = filteredFoodTrucks
                  .map((foodTruck) => {
                    const distance = calculateDistance(
                      userLatitude,
                      userLongitude,
                      foodTruck.latitude,
                      foodTruck.longitude
                    );
                    const distanceInMiles = distance * 0.62137119;
                    return { ...foodTruck, distance: distanceInMiles };
                  })
                  .filter((foodTruck) => foodTruck.distance <= distanceThreshold);

                closeFoodTrucks.sort((a, b) => a.distance - b.distance);

                if (closeFoodTrucks.length > 0) {
                  setSearchResults(closeFoodTrucks);
                  setIsEmptyResults(false);
                } else {
                  setSearchResults([]);
                  setIsEmptyResults(true);
                }
              })
              .catch((error) => {
                console.error('Error:', error);
              });
          } else {
            setSearchResults([]);
            setIsEmptyResults(true);
          }
        } else {
          console.error('Geocoding request failed');
        }
      })
    .catch((error) => {
      console.error('Error occurred while geocoding:', error);
    });
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

  const handleSearchRadius = (event) => {
    const newValue = parseInt(event.target.value);
    setSearchRadius(newValue);
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
        <div className='main-ui'>
          <p className='page-title'>Food Truck Finder (San Francisco, California)</p>
          <div className='second-search-bar'>
            <form className='search-address-bar' onSubmit={handleFormSubmit}>
              <input type="text" placeholder="Enter an address..." value={addressInput} onChange={(e) => setAddressInput(e.target.value)}/>
            </form>
            <div className='search-radius'>
              <p className="miles-text" >within {searchRadius} mile(s)</p>
              <input className='slider' type="range" min={1} max={10} step={0.1} value={searchRadius} onChange={handleSearchRadius}/>
            </div>
          </div>
          <div className="search-bar">
            <input type="text" placeholder="i.e. name, genre, type..." value={searchTerm}  onChange={(e) => setSearchTerm(e.target.value)} onSubmit={handleSearch}/>
            <button className="search-button" onClick={handleFormSubmit}>Search</button> {/* Button to search */}
            <button className="show-all-button" onClick={handleButtonToggle}>Show All</button> {/* Button to show/hide markers */}
          </div>
          {(addressInput || searchTerm) && (
          <div className="search-results">
            {isEmptyResults && <p>No Results</p>}
            {foodTrucks.length > 0 &&
              searchResults.map((foodTruck, index) => (
                <div key={foodTruck.objectid} className="foodtruck-item">
                  <div className='foodtruck-details'>
                    <h3 className='applicant'>
                      {`${index + 1}. ${foodTruck.applicant}`} 
                      {foodTruck.distance ? ' (' + foodTruck.distance.toFixed(2) + ' miles away)' : ''}
                    </h3>
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
        </div>
       
        


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

        <Marker
              latitude={parseFloat(userLatitude)}
              longitude={parseFloat(userLongitude)}
        >
          <TbCircleFilled className="current-location-icon"/>
        </Marker>

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