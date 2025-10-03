import { useState, useEffect } from "react";
import apiInstance from "../utils/axios";
import UserData from "./UserData";

export default function UseProfileData() {
  const [profile, setProfile] = useState([]);
  const userData = UserData();

  useEffect(() => {
    apiInstance.get(`user/profile/${userData?.user_id}/`).then((res) => {
      setProfile(res.data);
      console.log(res.data);
    });
  }, []);
  return profile;
}
