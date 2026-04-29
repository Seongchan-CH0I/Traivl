'use client';

import { useState, useEffect } from 'react';

interface Destination {
    id: string;
    name: string;
    country: string;
    dnaType: string;
    description: string;
    imageUrl: string;
}

interface Place {
    id: string;
    name: string;
    category: string;
    description: string;
    imageUrl: string;
    rank: number;
}

export default function PopularCities() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const res = await fetch('/api/destinations');
                const data = await res.json();
                if (data.success) {
                    setDestinations(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch destinations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDestinations();
    }, []);

    useEffect(() => {
        const fetchPlaces = async () => {
            if (selectedId) {
                try {
                    const res = await fetch(`/api/places?destinationId=${selectedId}&limit=3`);
                    const data = await res.json();
                    if (data.success) {
                        setSelectedPlaces(data.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch places:', err);
                }
            } else {
                setSelectedPlaces([]);
            }
        };

        fetchPlaces();
    }, [selectedId]);

    const handleCityClick = (id: string) => {
        if (selectedId === id) {
            setSelectedId(null);
        } else {
            setSelectedId(id);
        }
    };

    const selectedCity = destinations.find(d => d.id === selectedId);

    if (loading) {
        return (
            <section className="horizontal-section" style={{ marginBottom: '18px' }}>
                <h2 className="section-title">실시간 인기 도시</h2>
                <div className="scroll-container">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="scroll-item circular animate-pulse">
                            <div className="circular-img-wrapper bg-gray-200" style={{ width: '70px', height: '70px' }}></div>
                            <div className="h-3 w-10 bg-gray-200 mt-2 rounded"></div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    return (
        <section className="horizontal-section" style={{ marginBottom: '18px' }}>
            <h2 className="section-title">실시간 인기 도시</h2>
            <div className="scroll-container">
                {destinations.map((city) => (
                    <div 
                        key={city.id} 
                        className={`scroll-item circular ${selectedId === city.id ? 'active-city' : ''}`}
                        onClick={() => handleCityClick(city.id)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="circular-img-wrapper">
                            <img src={city.imageUrl} alt={city.name} referrerPolicy="no-referrer" />
                        </div>
                        <span>{city.name.split(',')[0]}</span>
                    </div>
                ))}
            </div>

            {selectedId && selectedCity && (
                <div className="city-accordion-content">
                    <div className="city-header">
                        <div className="city-info-text">
                            <p className="dna-badge">{selectedCity.dnaType}</p>
                            <h3>{selectedCity.name}</h3>
                            <p className="city-desc">{selectedCity.description}</p>
                        </div>
                    </div>
                    
                    {selectedPlaces.length > 0 && (
                        <div className="famous-places">
                            <h4>대표적인 추천 명소</h4>
                            <div className="places-mini-grid">
                                {selectedPlaces.map(place => (
                                    <div key={place.id} className="place-mini-card">
                                        <img src={place.imageUrl} alt={place.name} referrerPolicy="no-referrer" />
                                        <span>{place.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
