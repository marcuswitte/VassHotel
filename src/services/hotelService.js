import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

const HOTELS_SEED = [
  {
    id: '1',
    name: 'VassHotel Barra Mansa',
    city: 'Barra Mansa',
    state: 'RJ',
    address: 'Rua Maestro José Bezerra, 120 - Centro, Barra Mansa - RJ',
    rating: 4.5,
    totalRatings: 328,
    coordinates: { latitude: -22.5435, longitude: -44.1715 },
    realHotelName: 'Hotel Plaza Ferreira',
    description:
      'O VassHotel Barra Mansa oferece conforto e sofisticação no coração da cidade. Com infraestrutura completa e atendimento personalizado, é a escolha ideal para viagens de negócios e lazer no Sul Fluminense.',
    amenities: ['Wi-Fi Grátis', 'Piscina', 'Academia', 'Restaurante', 'Estacionamento', 'Ar-condicionado'],
    imageKey: '1',
    gradientColors: ['#C05621', '#E07B39', '#F4A261'],
    phone: '(24) 3322-4000',
    email: 'barramansa@vasshotel.com.br',
    isAvailable: true,
  },
  {
    id: '2',
    name: 'VassHotel Volta Redonda',
    city: 'Volta Redonda',
    state: 'RJ',
    address: 'Av. Amaral Peixoto, 55 - Centro, Volta Redonda - RJ',
    rating: 4.2,
    totalRatings: 245,
    coordinates: { latitude: -22.5232, longitude: -44.1045 },
    realHotelName: 'Hotel Avenida',
    description:
      'Localizado na região central de Volta Redonda, o VassHotel oferece uma experiência premium com spa, bar sofisticado e salas de conferência modernas. Ideal para executivos e turistas que buscam o melhor da hospitalidade.',
    amenities: ['Wi-Fi Grátis', 'Spa', 'Bar', 'Restaurante', 'Sala de Conferências', 'Room Service'],
    imageKey: '2',
    gradientColors: ['#023E8A', '#0077B6', '#00B4D8'],
    phone: '(24) 3343-5500',
    email: 'voltaredonda@vasshotel.com.br',
    isAvailable: true,
  },
  {
    id: '3',
    name: 'VassHotel Vassouras',
    city: 'Vassouras',
    state: 'RJ',
    address: 'Praça Barão de Campo Belo, 8 - Centro, Vassouras - RJ',
    rating: 4.8,
    totalRatings: 189,
    coordinates: { latitude: -22.4039, longitude: -43.6632 },
    realHotelName: 'Hotel Fazenda Galo Vermelho',
    description:
      'Instalado em um casarão histórico no centro de Vassouras, o VassHotel preserva a arquitetura imperial da Cidade Imperial do Café. Um refúgio único que combina história, natureza e hospitalidade de alto padrão.',
    amenities: ['Wi-Fi Grátis', 'Jardim Histórico', 'Café Colonial', 'Bicicletas', 'Tour Histórico', 'Piscina'],
    imageKey: '3',
    gradientColors: ['#1B4332', '#2D6A4F', '#52B788'],
    phone: '(24) 2471-2000',
    email: 'vassouras@vasshotel.com.br',
    isAvailable: true,
  },
];

export const seedHotels = async () => {
  const snap = await getDocs(collection(db, 'hotels'));
  if (!snap.empty) return;
  for (const hotel of HOTELS_SEED) {
    const { id, ...data } = hotel;
    await setDoc(doc(db, 'hotels', id), data);
  }
};

export const getHotels = async () => {
  const snap = await getDocs(collection(db, 'hotels'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
