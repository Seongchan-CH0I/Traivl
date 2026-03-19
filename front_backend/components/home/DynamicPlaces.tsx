"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Place {
    id: number;
    name: string;
    imageUrl: string;
    description: string;
}

interface DynamicPlacesProps {
    destinationId: string;
    cityName: string;
}

export default function DynamicPlaces({ destinationId, cityName }: DynamicPlacesProps) {
    const [places, setPlaces] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
            <div className="section-header-row">
                <h2 className="section-title mb-0">{cityName} 실시간 인기 장소</h2>
                <div className="filter-chips">
                    <button className="chip active">관광지</button>
                </div>
            </div>
            <div className="scroll-container mt-3">
                {places.map((place) => (
                    <div key={place.id} className="scroll-item rectangular">
                        <img src={place.imageUrl || "/images/placeholder.jpg"} alt={place.name} />
                        <div className="info">
                            <h3>{place.name}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
