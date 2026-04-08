import { HOTEL_IMG_1, HOTEL_IMG_2, HOTEL_IMG_3 } from '../assets/images';

export const HOTELS_BASE = [
  {
    id: '1',
    name: 'VassHotel Barra Mansa',
    city: 'Barra Mansa',
    state: 'RJ',
    address: 'Rua Maestro José Bezerra, 120 - Centro, Barra Mansa - RJ',
    rating: 4.5,
    totalRatings: 328,
    coordinates: {
      latitude: -22.5435,
      longitude: -44.1715,
    },
    description:
      'VassHotel Barra Mansa',
    amenities: ['Wi-Fi Grátis', 'Piscina', 'Academia', 'Restaurante', 'Estacionamento', 'Ar-condicionado'],
    image: HOTEL_IMG_1,
    gradientColors: ['#C05621', '#E07B39', '#F4A261'],
    phone: '(24) 3322-4000',
    email: 'barramansa@vasshotel.com.br',
  },
  {
    id: '2',
    name: 'VassHotel Volta Redonda',
    city: 'Volta Redonda',
    state: 'RJ',
    address: 'Av. Amaral Peixoto, 55 - Centro, Volta Redonda - RJ',
    rating: 4.2,
    totalRatings: 245,
    coordinates: {
      latitude: -22.5232,
      longitude: -44.1045,
    },
    description:
      'VassHotel Volta Redonda',
    amenities: ['Wi-Fi Grátis', 'Spa', 'Bar', 'Restaurante', 'Sala de Conferências', 'Room Service'],
    image: HOTEL_IMG_2,
    gradientColors: ['#023E8A', '#0077B6', '#00B4D8'],
    phone: '(24) 3343-5500',
    email: 'voltaredonda@vasshotel.com.br',
  },
  {
    id: '3',
    name: 'VassHotel Vassouras',
    city: 'Vassouras',
    state: 'RJ',
    address: 'Praça Barão de Campo Belo, 8 - Centro, Vassouras - RJ',
    rating: 4.8,
    totalRatings: 189,
    coordinates: {
      latitude: -22.4039,
      longitude: -43.6632,
    },
    description:
      'VassHotel Vassouras',
    amenities: ['Wi-Fi Grátis', 'Jardim Histórico', 'Café Colonial', 'Bicicletas', 'Tour Histórico', 'Piscina'],
    image: HOTEL_IMG_3,
    gradientColors: ['#1B4332', '#2D6A4F', '#52B788'],
    phone: '(24) 2471-2000',
    email: 'vassouras@vasshotel.com.br',
  },
];

export const getHotelsWithAvailability = () =>
  HOTELS_BASE.map((hotel) => ({
    ...hotel,
    isFull: Math.random() < 0.5,
  }));
