"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Place } from '../../types/place';
import PlaceDetailModal from '../ui/PlaceDetailModal';

interface DynamicPlacesProps {
    destinationId: string;
    cityName: string;
}

export default function DynamicPlaces({ destinationId, cityName }: DynamicPlacesProps) {
    const [places, setPlaces] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

    useEffect(() => {
        if (!destinationId) return;

        setIsLoading(true);
        fetch(`/api/places?destinationId=${destinationId}&category=관광지`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setPlaces(res.data);
                }
            })
            .catch(err => console.error("Failed to fetch places", err))
            .finally(() => setIsLoading(false));
    }, [destinationId]);

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin text-[#8c52ff]" size={32} />
            </div>
        );
    }

    if (!places.length) return null;

    return (
        <section className="horizontal-section">
            <div className="section-header-row px-5">
                <h2 className="section-title mb-0">{cityName} 실시간 인기 장소</h2>
                <div className="filter-chips">
                    <button className="chip active">관광지</button>
                </div>
            </div>
            <div className="scroll-container mt-4 pb-2 px-5 gap-3">
                {places.map((place) => (
                    <div 
                        key={place.id} 
                        className="scroll-item rectangular cursor-pointer active:scale-[0.98] transition-all hover:shadow-md border border-gray-100"
                        style={{ flex: '0 0 calc((100% - 24px) / 2.2)', minWidth: '150px' }}
                        onClick={() => setSelectedPlace(place)}
                    >
                        <img src={place.imageUrl || "/images/placeholder.jpg"} alt={place.name} className="h-[110px] w-full object-cover" />
                        <div className="info p-3">
                            <h3 className="text-[13px] font-bold truncate text-gray-900">{place.name}</h3>
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 leading-tight">{place.description}</p>
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
