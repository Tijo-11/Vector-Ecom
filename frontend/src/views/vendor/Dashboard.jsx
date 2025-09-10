import {
  Grid,
  ShoppingCart,
  Users,
  IndianRupee,
  Eye,
  Edit,
  Trash,
} from "lucide-react";
import VendorSidebar from "./Sidebar";

export default function Dashboard() {
  return (
    <div className="w-full px-4" id="main">
      <div className="flex flex-row h-full">
        <div className="w-full" id="main">
          <div className="flex h-full">
            <VendorSidebar />
            <div className="flex-1 mt-4 px-4">
              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <Grid size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Products</h6>
                  <h1 className="text-4xl font-bold">134</h1>
                </div>

                <div className="bg-red-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <ShoppingCart size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Orders</h6>
                  <h1 className="text-4xl font-bold">87</h1>
                </div>

                <div className="bg-sky-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <Users size={64} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Customers</h6>
                  <h1 className="text-4xl font-bold">125</h1>
                </div>

                <div className="bg-yellow-500 text-white rounded-xl shadow p-4 flex flex-col items-start">
                  <div className="self-end opacity-20">
                    <IndianRupee size={24} />
                  </div>
                  <h6 className="uppercase tracking-wide text-sm">Revenue</h6>
                  <h1 className="text-4xl font-bold">₹36</h1>
                </div>
              </div>

              <hr className="my-6" />

              {/* Chart Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold">Chart Analytics</h4>
                </div>
                <div className="bg-white rounded-xl shadow p-4">
                  <canvas id="line-chart" className="w-full h-64" />
                </div>
              </div>

              <a id="layouts" />
              <hr className="my-6" />

              {/* Tabs Section */}
              <div className="mb-24">
                {/* Tabs */}
                <ul className="flex border-b mb-4">
                  <li className="mr-1">
                    <a
                      className="inline-block px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium"
                      href="#home1"
                      role="tab"
                    >
                      Products
                    </a>
                  </li>
                  <li className="mr-1">
                    <a
                      className="inline-block px-4 py-2 text-gray-600 hover:text-blue-600"
                      href="#profile1"
                      role="tab"
                    >
                      Orders
                    </a>
                  </li>
                </ul>

                {/* Tab Content */}
                <div className="mt-4">
                  {/* Products Tab */}
                  <div id="home1">
                    <h4 className="text-lg font-semibold mb-4">Products</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <thead className="bg-gray-800 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left">#ID</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Price</th>
                            <th className="px-4 py-2 text-left">Quantity</th>
                            <th className="px-4 py-2 text-left">Orders</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-4 py-2">#erituo</td>
                            <td className="px-4 py-2">Turtle Neck Shirt</td>
                            <td className="px-4 py-2">$20</td>
                            <td className="px-4 py-2">14</td>
                            <td className="px-4 py-2">26</td>
                            <td className="px-4 py-2">Live</td>
                            <td className="px-4 py-2 space-x-2">
                              <a
                                href=""
                                className="bg-blue-500 text-white px-2 py-1 rounded inline-flex items-center"
                              >
                                <Eye size={18} />
                              </a>
                              <a
                                href=""
                                className="bg-green-500 text-white px-2 py-1 rounded inline-flex items-center"
                              >
                                <Edit size={18} />
                              </a>
                              <a
                                href=""
                                className="bg-red-500 text-white px-2 py-1 rounded inline-flex items-center"
                              >
                                <Trash size={18} />
                              </a>
                            </td>
                          </tr>
                          {/* Repeat rows */}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Orders Tab */}
                  <div id="profile1" className="hidden">
                    <h4 className="text-lg font-semibold mb-4">Orders</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-auto border-collapse">
                        <thead className="bg-gray-800 text-white">
                          <tr>
                            <th className="px-4 py-2 text-left">#Order ID</th>
                            <th className="px-4 py-2 text-left">Total</th>
                            <th className="px-4 py-2 text-left">
                              Payment Status
                            </th>
                            <th className="px-4 py-2 text-left">
                              Delivery Status
                            </th>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr>
                            <td className="px-4 py-2">#trytrr</td>
                            <td className="px-4 py-2">$100.90</td>
                            <td className="px-4 py-2">Paid</td>
                            <td className="px-4 py-2">Shipped</td>
                            <td className="px-4 py-2">20th June, 2023</td>
                            <td className="px-4 py-2">
                              <a
                                href=""
                                className="bg-blue-500 text-white px-2 py-1 rounded inline-flex items-center"
                              >
                                <Eye size={18} />
                              </a>
                            </td>
                          </tr>
                          {/* Repeat rows */}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
