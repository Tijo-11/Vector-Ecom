import React from "react";

// Placeholder data; replace with API data later
const items = [
  {
    id: 1,
    code: "RF293",
    title: "Luxe card holder",
    height: "10 inches",
    color: "Black",
    composition: "100% calf leather",
    price: 1000,
    image: "https://i.ibb.co/6gzWwSq/Rectangle-20-1.png",
    imageMobile: "https://i.ibb.co/TTnzMTf/Rectangle-21.png",
  },
  {
    id: 2,
    code: "RF294",
    title: "Luxe card holder",
    height: "10 inches",
    color: "Black",
    composition: "100% calf leather",
    price: 1000,
    image: "https://i.ibb.co/6gzWwSq/Rectangle-20-1.png",
    imageMobile: "https://i.ibb.co/TTnzMTf/Rectangle-21.png",
  },
];

function CartItem() {
  return (
    <>
      {items.map((item) => (
        <div
          key={item.id}
          className="md:flex items-stretch py-8 md:py-10 lg:py-8 border-t border-gray-50"
        >
          <div className="md:w-4/12 2xl:w-1/4 w-full">
            <img
              src={item.image}
              alt={item.title}
              className="h-full object-center object-cover md:block hidden"
            />
            <img
              src={item.imageMobile}
              alt={item.title}
              className="md:hidden w-full h-full object-center object-cover"
            />
          </div>
          <div className="md:pl-3 md:w-8/12 2xl:w-3/4 flex flex-col justify-center">
            <p className="text-xs leading-3 text-gray-800 md:pt-0 pt-4">
              {item.code}
            </p>
            <div className="flex items-center justify-between w-full">
              <p className="text-base font-black leading-none text-gray-800">
                {item.title}
              </p>
              <select
                aria-label="Select quantity"
                className="py-2 px-1 border border-gray-200 mr-6 focus:outline-none"
              >
                <option>01</option>
                <option>02</option>
                <option>03</option>
              </select>
            </div>
            <p className="text-xs leading-3 text-gray-600 pt-2">
              Height: {item.height}
            </p>
            <p className="text-xs leading-3 text-gray-600 py-4">
              Color: {item.color}
            </p>
            <p className="w-96 text-xs leading-3 text-gray-600">
              Composition: {item.composition}
            </p>
            <div className="flex items-center justify-between pt-5">
              <div className="flex items-center">
                <p className="text-xs leading-3 underline text-gray-800 cursor-pointer">
                  Add to favorites
                </p>
                <p className="text-xs leading-3 underline text-red-500 pl-5 cursor-pointer">
                  Remove
                </p>
              </div>
              <p className="text-base font-black leading-none text-gray-800">
                ${item.price}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default CartItem;
