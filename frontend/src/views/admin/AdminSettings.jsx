import React, { useState, useEffect } from "react";
import AdminSidebar from "./Sidebar";
import apiInstance from "../../utils/axios";
import { Save, Loader2 } from "lucide-react";
import Toast from "../../plugin/Toast";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    view_more: "",
    currency_sign: "",
    currency_abbreviation: "",
    service_fee_percentage: "",
    service_fee_flat_rate: "",
    service_fee_charge_type: "percentage",
    enforce_2fa: false,
    activate_affiliate_system: false,
    send_email_notifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiInstance.get("/admin/settings/");
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiInstance.patch("/admin/settings/", settings);
      Toast().fire({
        icon: "success",
        title: "Settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      Toast().fire({
        icon: "error",
        title: "Failed to update settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <section className="bg-white p-6 rounded-2xl shadow-sm border max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Admin Settings</h1>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency Sign</label>
                <input
                  type="text"
                  name="currency_sign"
                  value={settings.currency_sign}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency Abbreviation</label>
                <input
                  type="text"
                  name="currency_abbreviation"
                  value={settings.currency_abbreviation}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700">View More Text</label>
                <input
                  type="text"
                  name="view_more"
                  value={settings.view_more}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
              </div>
            </div>

            <hr className="my-6" />
            <h2 className="text-lg font-medium">Service Fees</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-medium text-gray-700">Charge Type</label>
                <select
                  name="service_fee_charge_type"
                  value={settings.service_fee_charge_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                >
                    <option value="percentage">Percentage</option>
                    <option value="flat_rate">Flat Rate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Percentage (%)</label>
                <input
                  type="number"
                  name="service_fee_percentage"
                  value={settings.service_fee_percentage}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Flat Rate Amount</label>
                <input
                  type="number"
                  name="service_fee_flat_rate"
                  value={settings.service_fee_flat_rate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                />
              </div>
            </div>

            <hr className="my-6" />
            <h2 className="text-lg font-medium">System Toggles</h2>

            <div className="space-y-4">
               <div className="flex items-center">
                <input
                  id="enforce_2fa"
                  name="enforce_2fa"
                  type="checkbox"
                  checked={settings.enforce_2fa}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="enforce_2fa" className="ml-2 block text-sm text-gray-900">
                  Enforce 2FA
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="activate_affiliate_system"
                  name="activate_affiliate_system"
                  type="checkbox"
                  checked={settings.activate_affiliate_system}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="activate_affiliate_system" className="ml-2 block text-sm text-gray-900">
                  Activate Affiliate System
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="send_email_notifications"
                  name="send_email_notifications"
                  type="checkbox"
                  checked={settings.send_email_notifications}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="send_email_notifications" className="ml-2 block text-sm text-gray-900">
                  Send Email Notifications
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? (
                   <>Saving...</>
                ) : (
                   <>
                    <Save size={18} className="mr-2" /> Save Settings
                   </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
