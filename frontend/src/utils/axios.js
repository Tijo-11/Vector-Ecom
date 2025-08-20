import axios from "axios";
// Create an Axios instance with custom configuration:

const apiInstance = axios.create({
  baseURL: "http://localhost:8000/api/", // Defines a key-value pair in a JS object (baseURL is the key, URL string is the value)
  timeout: 5000, //timeout: 5000ms (5 seconds); cancels requests taking longer than this.
  headers: {
    "Content-Type": "application/json", //Sends requests in JSON format.
    Accept: "application/json", //Expects JSON responses from the server.
  },
});

export default apiInstance;
//In JavaScript, objects are made up of properties written as key: value pairs. So here, baseURL is
//  the property name, and 'http://localhost:8000/api/' is its assigned value—typically used in Axios config
// or API service setups.
