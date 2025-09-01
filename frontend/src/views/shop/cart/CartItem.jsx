import React from "react";

function CartItem({ cartItems }) {
  return (
    <>
      {cartItems.map((c, index) => (
        <div
          key={index}
          className="md:flex items-stretch py-8 md:py-10 lg:py-8 border-t border-gray-50"
        >
          <div className="md:w-4/12 2xl:w-1/4 w-full">
            <img
              src={c.product.image}
              alt={c.product.title}
              className="h-full object-cover md:block hidden rounded-[10px]"
            />
            <img
              src={c.product.image}
              alt={c.product.title}
              className="md:hidden w-full h-full object-cover rounded-[10px]"
            />
          </div>
          <div className="md:pl-3 md:w-8/12 2xl:w-3/4 flex flex-col justify-center">
            <p className="text-xs leading-3 text-gray-800 md:pt-0 pt-4">
              {c.product.code || "N/A"}
            </p>
            <div className="flex items-center justify-between w-full">
              <p className="text-base font-black leading-none text-gray-800">
                {c.product.title}
              </p>
              <select
                aria-label="Select quantity"
                defaultValue={c.qty}
                className="py-2 px-1 border border-gray-200 mr-6 focus:outline-none"
              >
                <option>01</option>
                <option>02</option>
                <option>03</option>
              </select>
            </div>
            <p className="text-xs leading-3 text-gray-600 pt-2">
              Height: {c.product.height || "N/A"}
            </p>
            {c.size && c.size !== "no size" && (
              <p className="text-xs leading-3 text-gray-600 py-4">
                Size: {c.size}
              </p>
            )}
            {c.color && c.color !== "no color" && (
              <p className="text-xs leading-3 text-gray-600 py-4">
                Color: {c.color}
              </p>
            )}
            <p className="w-96 text-xs leading-3 text-gray-600">
              Composition: {c.product.composition || "N/A"}
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
                ₹{c.price}
              </p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default CartItem;
