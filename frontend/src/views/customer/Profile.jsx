import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import UserData from "../../plugin/UserData";
import { Link } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState({});
  const [addresses, setAddresses] = useState([]);
  const userData = UserData();

  useEffect(() => {
    apiInstance.get(`user/profile/`).then((res) => {
      setProfile(res.data.profile);
      setAddresses(res.data.addresses);
    });
  }, []);

  return (
    <main className="mt-5 mb-10">
      <div className="container mx-auto px-4">
        <section className="flex flex-col lg:flex-row gap-6">
          <Sidebar />
          <div className="flex-1">
            <h3 className="text-2xl font-semibold mb-6">My Profile</h3>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center gap-6 mb-6">
                <img
                  src={profile.image || "/default-avatar.png"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover"
                />
                <div>
                  <h4 className="text-xl font-bold">
                    {profile.full_name || "User"}
                  </h4>
                  <p className="text-gray-600">{profile.user?.email}</p>
                  <p className="text-gray-600">
                    {profile.user?.phone || "No phone"}
                  </p>
                  <Link
                    to="/customer/settings/"
                    className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>About:</strong> {profile.about || "Not provided"}
                </div>
                <div>
                  <strong>Country:</strong> {profile.country || "—"}
                </div>
                <div>
                  <strong>City:</strong> {profile.city || "—"}
                </div>
                <div>
                  <strong>State:</strong> {profile.state || "—"}
                </div>
                <div>
                  <strong>Address:</strong> {profile.address || "—"}
                </div>
                <div>
                  <strong>Pincode:</strong> {profile.postal_code || "—"}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold">My Addresses</h4>
                <Link
                  to="/customer/addresses/"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Manage Addresses
                </Link>
              </div>
              {addresses.length === 0 ? (
                <p className="text-gray-500">No addresses saved yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 border rounded-lg ${
                        addr.status ? "border-green-500 bg-green-50" : ""
                      }`}
                    >
                      <p className="font-semibold">{addr.full_name}</p>
                      <p>
                        {addr.address}, {addr.town_city}
                      </p>
                      <p>
                        {addr.state || ""} {addr.zip}
                      </p>
                      <p>{addr.country?.name || addr.country}</p>
                      <p>{addr.mobile}</p>
                      {addr.status && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Profile;
