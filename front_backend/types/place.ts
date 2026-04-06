export interface Place {
    id: number;
    name: string;
    imageUrl: string;
    description: string;
    category: string;
    rank?: number;
    rating?: number;
    address?: string;
    latitude?: number;
    longitude?: number;
    openingHours?: string;
    phoneNumber?: string;
    tags?: string[];
    averagePrice?: number;
    destination?: {
        name: string;
    };
}
