import React, { useEffect, useState, useRef, useContext } from "react";
import { GoogleMap, LoadScript, Polyline, Marker } from "@react-google-maps/api";
import DataContext from "./DataContext";
import AutoCompleteComponent from './AutoCompleteComponent';
import alert from './assets/alert.mp3';
import appLogo from './assets/logo.png';

const mapStyles = {
  height: '100vh',
  width: '100%',
};

const MapComponent = () => {
  const [sourceAutocomplete, setSourceAutocomplete] = useState(null);
  const [destinationAutocomplete, setDestinationAutocomplete] = useState(null);
  const [sourceLocation, setSourceLocation] = useState({});
  const [destinationLocation, setDestinationLocation] = useState({});
  const [routeCrashDetails, setRouteCrashDetails] = useState([]);
  const [sourceAddress, setSourceAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [gMap, setGMap] = useState();
  const [multipleRoutes, setMultipleRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState([]);
  const [calculatingCrashes, setCalculatingCrashes] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const crashWarningsRef = useRef([]);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  const data = useContext(DataContext);
  const mapData = data.mapData;

  const [audio] = useState(new Audio(alert));

  const onSourceLoad = (auto) => setSourceAutocomplete(auto);
  const onDestinationLoad = (auto) => setDestinationAutocomplete(auto);

  const onSourceChanged = () => {
    if (sourceAutocomplete !== null) {
      const place = sourceAutocomplete.getPlace();
      setSourceAddress(place.formatted_address);
      setSourceLocation({lat: place.geometry.location.lat(), lng: place.geometry.location.lng()});
    }
  };

  const onDestinationChanged = () => {
    if (destinationAutocomplete !== null) {
      const place = destinationAutocomplete.getPlace();
      setDestinationAddress(place.formatted_address);
      setDestinationLocation({lat: place.geometry.location.lat(), lng: place.geometry.location.lng()});
    }
  };

  const onChangeHandler = (gMap) => {
    if (sourceAddress === destinationAddress && sourceAddress !== '' && destinationAddress != '') {
      alert("Please make sure source and destination are different!");
      return;
    }
    if (selectedRoute.length > 1) {
      crashWarningsRef.current.forEach((circle) => {
        circle && circle.setMap && circle.setMap(null);
      });
    }
    crashWarningsRef.current = [];
    calculateAndDisplayRoute(() => gMap);
  };

  const calculateAndDisplayRoute = (getMap) => {
    
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;
    setCalculatingCrashes(true);
    directionsServiceRef.current
      .route({
        origin: {
          query: sourceAddress,
        },
        destination: {
          query: destinationAddress,
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
      })
      .then((result) => {
        directionsRendererRef.current.setDirections(result);
        directionsRendererRef.current.setOptions({
          polylineOptions: {
            strokeColor: "#65ace6",
          },
        });

        let routes = result.routes;
        let overviewPaths = [];
        for (let i = 0; i < routes.length; i++) {
          overviewPaths.push(routes[i].overview_path);
        }
        setMultipleRoutes(overviewPaths);
        setSelectedRoute(overviewPaths);

        const searchByCoordinates = (latitude, longitude) => {
          const lat = parseFloat(latitude).toFixed(2);
          const lng = parseFloat(longitude).toFixed(2)
          return mapData.get(lat + '_' + lng);
        };

        const findWarningColors = (warning, medianRecords) => {
          if (warning.length > medianRecords) return "red";
          else if ((warning.length = medianRecords)) return "orange";
          else return "yellow";
        };

        let routesData = routes;
        let routeCrashDetails = [];
        routesData.forEach((route) => {
          let crashWarningsData = [];
          let maxRecords = -1;
          let coords = route.overview_path;
          coords.forEach((coord) => {
            let coordInfo = searchByCoordinates(coord.lat(), coord.lng());
            if (coordInfo) {
              if (coordInfo.count > maxRecords) {
                maxRecords = coordInfo.count;
              }
              (coordInfo.coords).forEach((coord) => {
                crashWarningsData.push(new window.google.maps.LatLng(coord.lat,coord.lng));
              })
            }
          });
          routeCrashDetails.push({route: route, accidentsCount: maxRecords});
          const medianRecords = maxRecords / 2;

          let data = [];

          crashWarningsData.forEach((warning) => {
            const warningCircle = new window.google.maps.Circle({
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: findWarningColors(warning, medianRecords),
              fillOpacity: 0.35,
              map: getMap(),
              center: warning,
              radius: Math.sqrt(2000) * 100
            });
            data.push(warningCircle);
          });
          crashWarningsRef.current.push(...data);
        });
        setRouteCrashDetails(routeCrashDetails);
        setCalculatingCrashes(false);
      })
      .catch((e) => window.alert("Directions request failed due to " + e));
  };

  const toggleButton = () => {
    setIsActive(!isActive);
    if (!isActive) {
      audio.play();
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  useEffect(() => {
    navigator.geolocation.watchPosition((position) => {
      setSourceLocation({lat: position.coords.latitude, lng: position.coords.longitude})
    });    
  }, []);

  useEffect(() => {
    onChangeHandler(gMap);
  }, [destinationAddress])

  useEffect(() => {
    if (gMap) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current =
        new window.google.maps.DirectionsRenderer();
      loadMaps();
    }
  }, [gMap]);

  const loadMaps = () => {
    if (gMap && directionsRendererRef.current) {
      directionsRendererRef.current.setMap(gMap);
    }
  };

  const onLoad = (map) => {
    setGMap(map);
  };

  const libraries = ['places'];

  const updateRoute = (routeName) => {
    debugger;
    let _selectedRoute = routeCrashDetails.filter((route) => route.route.summary === routeName)[0];
    setSelectedRoute([_selectedRoute.route.overview_path]);
  }

  return (
    <LoadScript googleMapsApiKey="AIzaSyBzTrQvxWyY_tVzTk-lgDbPwQcfOjYy2Yc" libraries={libraries}>
   <div className="relative flex">
    <div className="absolute z-10 m-4">
      <img src={appLogo} width={80} className="rounded-full" />
    </div>
    <div className="flex flex-col ml-16 absolute">
      <div>
        <AutoCompleteComponent
          id={'source'}
          placeholder={'Source'}
          className={' bg-white h-10 text-gray-500 absolute z-10 mt-4 ml-16 p-2 border border-gray-400 rounded-lg'}
          onLoad={onSourceLoad}
          onPlaceChanged={onSourceChanged}
        />
      </div>
      <div>
        <AutoCompleteComponent
          id={'destination'}
          placeholder={'Destination'}
          className={' bg-white h-10 text-gray-500 absolute z-10 ml-16 mt-16 p-2 border border-gray-400 rounded-lg'}
          onLoad={onDestinationLoad}
          onPlaceChanged={onDestinationChanged}
        />
      </div>
    </div>

    <div className="flex-1 p-0 m-0">
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={13}
        onLoad={onLoad}
        center={sourceLocation}
        options={{ mapTypeControl: false, fullscreenControl: false, streetViewControl: false }}
      >
        {sourceLocation && <Marker position={sourceLocation} />}
        {selectedRoute?.length > 0 &&
          selectedRoute.map((route, index) => (
            <Polyline
              key={index}
              path={route.map((coord) => {
                return { lat: coord.lat(), lng: coord.lng() };
              })}
              options={{ strokeColor: "#65ace6" }}
            />
          ))}
      </GoogleMap>
    </div>
  </div> 

  <div className="absolute top-4 right-4">
    <button
      className={`m-4 p-2 border border-gray-400 rounded-lg ${
        isActive ? 'bg-gray-500' : 'bg-green-500'
      } text-white px-4 py-2 rounded-full focus:outline-none`}
      onClick={toggleButton}
    >
      {isActive ? 'Turn Off' : 'Alert Me'}
    </button>
  </div>

  {calculatingCrashes && (
    <div className="flex justify-center items-center">
      <div className="mb-20 absolute inset-0 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-black border-r-2 rounded-full"></div>
      </div>
      <div className="z-10 font-bold text-2xl bg-white opacity-75 absolute inset-0 flex justify-center items-center">
        Loading all possible routes...
      </div>
    </div>
  )}
</LoadScript>

  );
};

export default MapComponent;
