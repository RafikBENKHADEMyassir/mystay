"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

type Restaurant = {
  id: string;
  name: string;
  image: string;
};

type Props = {
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
  onClose: () => void;
};

export function RestaurantSelectionSheet({ restaurants, onSelect, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false);

  function handleClose() {
    setIsClosing(true);
    setTimeout(onClose, 250);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-250 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      />

      <div
        className={`relative transition-transform duration-250 ${isClosing ? "translate-y-full" : "translate-y-0"}`}
      >
        <div className="rounded-t-[16px] bg-white px-[8px] pb-[24px] pt-[8px]">
          <div className="overflow-hidden rounded-[16px] bg-white py-[32px]">
            {/* Drag handle */}
            <div className="absolute left-1/2 top-[8px] h-[3px] w-[36px] -translate-x-1/2 rounded-[99px] bg-black/15" />

            {/* Title */}
            <div className="px-[16px] pb-[32px] text-center">
              <p className="text-[18px] text-black">Réserver un restaurant</p>
            </div>

            {/* Question + subtitle */}
            <div className="px-[16px] pb-[24px] text-center">
              <p className="text-[15px] leading-[1.15] text-black">
                Dans quel restaurant de notre établissement souhaitez vous réserver une table ?
              </p>
              <p className="mt-[6px] text-[15px] leading-[1.15] text-black/50">
                Appuyez pour consulter les détails et le menu.
              </p>
            </div>

            {/* Restaurant cards - horizontal scroll */}
            <div className="overflow-x-auto px-[16px]">
              <div className="flex gap-[4px] pr-[16px]">
                {restaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => onSelect(restaurant)}
                    className="relative h-[220px] w-[150px] shrink-0 overflow-hidden rounded-[6px]"
                  >
                    <div className="absolute inset-0 rounded-[6px] border border-black/10">
                      <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="h-full w-full object-cover"
                        />
                        <div
                          className="absolute inset-x-0 bottom-0 top-[32%]"
                          style={{
                            backgroundImage:
                              "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.098) 20%, rgba(0,0,0,0.325) 49.519%, rgba(0,0,0,0.584) 100%)",
                          }}
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start justify-end px-[12px] py-[16px]">
                      <p className="text-left text-[23px] uppercase leading-[1.25] text-white">
                        {restaurant.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
