import { nanoid } from 'nanoid';
import type { TripInput } from '../shared/types/trip.ts';

/** Voyage d'exemple pré-rempli à la création (modifiable ensuite). */
export function buildDefaultTrip(): TripInput {
  return {
    title: 'Voyage au Japon',
    description: 'Itinéraire à personnaliser — clique sur une étape ou un lieu pour éditer.',
    outboundFlight: {
      airport: 'Aéroport de Tokyo Narita',
      airportLocation: { lat: 35.772, lng: 140.3929 },
      date: '',
      legs: [
        {
          id: nanoid(8),
          flightNumber: 'AF276',
          from: 'Paris CDG',
          to: 'Tokyo Narita',
          departureTime: '13:30',
          arrivalTime: '08:55',
        },
      ],
      currency: '€',
    },
    returnFlight: {
      airport: 'Aéroport d\'Osaka Kansai',
      airportLocation: { lat: 34.4342, lng: 135.244 },
      date: '',
      legs: [
        {
          id: nanoid(8),
          flightNumber: 'AF291',
          from: 'Osaka Kansai',
          to: 'Paris CDG',
          departureTime: '11:25',
          arrivalTime: '16:55',
        },
      ],
      currency: '€',
    },
    stages: [
      {
        id: nanoid(8),
        name: 'Tokyo',
        color: '#e11d48',
        accommodation: {
          name: 'Hôtel à Tokyo',
          address: 'Shinjuku, Tokyo',
          location: { lat: 35.6938, lng: 139.7034 },
          arrivalTime: '15:00',
          departureTime: '10:00',
          modalities: 'Check-in à partir de 15h, dépôt de bagages possible avant.',
        },
        places: [
          {
            id: nanoid(8),
            name: 'Senso-ji',
            category: 'culture',
            location: { lat: 35.7148, lng: 139.7967 },
            visited: false,
          },
          {
            id: nanoid(8),
            name: 'Shibuya Crossing',
            category: 'sight',
            location: { lat: 35.6595, lng: 139.7005 },
            visited: false,
          },
        ],
        transportToNext: {
          id: nanoid(8),
          mode: 'shinkansen',
          label: 'Shinkansen Tokyo → Kyoto',
          from: 'Tokyo',
          to: 'Kyoto',
          departureTime: '09:00',
          arrivalTime: '11:15',
          reference: 'Nozomi',
          price: 13320,
          currency: '¥',
        },
      },
      {
        id: nanoid(8),
        name: 'Kyoto',
        color: '#2563eb',
        accommodation: {
          name: 'Ryokan à Kyoto',
          address: 'Higashiyama, Kyoto',
          location: { lat: 34.9948, lng: 135.7849 },
        },
        places: [
          {
            id: nanoid(8),
            name: 'Fushimi Inari-taisha',
            category: 'culture',
            location: { lat: 34.9671, lng: 135.7727 },
            visited: false,
          },
        ],
      },
    ],
  };
}
