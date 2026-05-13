"use client";

import { X, MapPin, Clock, Phone, Star } from 'lucide-react';
import { Place } from '../../types/place';

interface PlaceDetailModalProps {
    place: Place | null;
    onClose: () => void;
}

export default function PlaceDetailModal({ place, onClose }: PlaceDetailModalProps) {
    if (!place) return null;

    return (
        <div 
            className="place-modal-overlay" 
            onClick={onClose}
        >
            <div 
                className="place-modal-content" 
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    className="close-modal-btn" 
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                <div className="modal-hero">
                    <img src={place.imageUrl || "/images/placeholder.jpg"} alt={place.name} />
                </div>

                <div className="modal-body">
                    <div className="modal-header-row">
                        <div className="modal-location-tag">
                            {place.destination?.name.split(',')[0]}
                        </div>
                        {place.rating && (
                            <div className="modal-rating">
                                <Star size={14} fill="#FFD700" color="#FFD700" />
                                <span>{place.rating}</span>
                            </div>
                        )}
                    </div>
                    <h2 className="modal-title">{place.name}</h2>

                    {place.tags && place.tags.length > 0 && (
                        <div className="modal-tags-container">
                            {place.tags.map((tag, i) => (
                                <span key={i} className="modal-tag-chip">{tag}</span>
                            ))}
                        </div>
                    )}

                    <div className="modal-divider"></div>
                    <p className="modal-description">
                        {place.description}
                    </p>

                    <div className="modal-meta-list">
                        {place.address && (
                            <div className="modal-meta-item">
                                <MapPin size={16} className="meta-icon" />
                                <span>{place.address}</span>
                            </div>
                        )}
                        {place.latitude && place.longitude && (
                            <div className="modal-meta-item">
                                <MapPin size={16} className="meta-icon" />
                                <span>위도/경도: {place.latitude}, {place.longitude}</span>
                            </div>
                        )}
                        {place.openingHours && (
                            <div className="modal-meta-item">
                                <Clock size={16} className="meta-icon" />
                                <span>{place.openingHours}</span>
                            </div>
                        )}
                        {place.phoneNumber && (
                            <div className="modal-meta-item">
                                <Phone size={16} className="meta-icon" />
                                <span>{place.phoneNumber}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
