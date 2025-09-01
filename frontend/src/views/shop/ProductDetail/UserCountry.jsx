import { useState, useEffect } from "react";

export default function UserCountry() {
  const [address, setAddress] = useState({});

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
          fetch(url)
            .then((res) => res.json())
            .then((data) => setAddress(data.address || {}))
            .catch((error) => console.error("Error fetching address:", error));
        },
        (error) => {
          console.error("Geolocation error:", error);
          setAddress({}); // Fallback to empty object if geolocation fails
        }
      );
    } else {
      console.error("Geolocation not supported");
      setAddress({}); // Fallback if geolocation is unavailable
    }
  }, []);

  return address;
}
