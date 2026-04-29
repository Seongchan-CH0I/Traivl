"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Place } from '../../types/place';
import PlaceDetailModal from '../ui/PlaceDetailModal';

interface DynamicRestaurantsProps {
    destinationId: string;
    cityName: string;
}

export default function DynamicRestaurants({ destinationId, cityName }: DynamicRestaurantsProps) {
    const [restaurants, setRestaurants] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    useEffect(() => {
        if (!destinationId) return;

        setIsLoading(true);
        fetch(`/api/places?destinationId=${destinationId}&category=맛집`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setRestaurants(res.data);
                }
            })
            .catch(err => console.error("Failed to fetch restaurants", err))
            .finally(() => setIsLoading(false));
    }, [destinationId]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-10 text-center">
                 <Loader2 className="animate-spin text-[#8c52ff]" size={32} />
            </div>
        );
    }

    if (!restaurants.length) return null;

    return (
        <section className="list-section">
            <div className="section-header-row px-5">
                <h2 className="section-title mb-0">놓치면 후회할 {cityName} 맛집 🍲</h2>
                <div className="filter-chips">
                    <button className="chip active">맛집</button>    
                </div>
            </div>

            <div className="list-container mt-4 px-5 flex flex-col gap-4">
                {restaurants.map((item) => (
                    <div 
                        key={item.id} 
                        className="list-item cursor-pointer active:scale-[0.98] transition-all hover:bg-gray-50 border border-gray-100 shadow-sm overflow-hidden"
                        onClick={() => setSelectedPlace(item)}
                    >
                        <div className="flex gap-4 w-full p-3">
                            <img 
                                src={item.imageUrl || "/images/placeholder.jpg"} 
                                alt={item.name} 
                                className="w-[70px] h-[70px] rounded-xl object-cover flex-shrink-0"
                            />
                            <div className="item-info flex flex-col justify-center flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-[15px] font-bold text-gray-900">{item.name}</h3>
                                    {item.rating && (
                                        <span className="text-[11px] font-semibold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                                            ★ {item.rating}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-snug">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <PlaceDetailModal 
                place={selectedPlace} 
                onClose={() => setSelectedPlace(null)} 
            />
        </section>
    );
}
