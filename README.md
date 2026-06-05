# VassHotel

Projeto desenvolvido na disciplina **Laboratório de Desenvolvimento de Aplicativos Híbridos**.

O aplicativo permite que usuários criem conta, naveguem pelo catálogo de hotéis da rede fictícia VassHotel, visualizem detalhes de cada unidade e realizem reservas, com autenticação biométrica e persistência de dados em nuvem via Firebase.

---

## Tecnologias Utilizadas

- JavaScript / React Native / Expo
- React Navigation (Native Stack)
- Firebase Authentication (login e cadastro por e-mail/senha)
- Cloud Firestore (banco de dados em nuvem)
- Expo Local Authentication (biometria)
- Expo Image Picker (foto de perfil)
- AsyncStorage (persistência da sessão Firebase)

---

## Funcionalidades

- **Cadastro e login** com e-mail e senha via Firebase Authentication
- **Autenticação biométrica** (digital / Face ID) ao reabrir o app
- **Catálogo de hotéis** carregado do Firestore com busca e pull-to-refresh
- **Detalhes do hotel** com mapa, avaliação, comodidades e contato
- **Reservas** com seleção de datas por calendário nativo e número de hóspedes
- **Minhas Reservas** — listagem e cancelamento de reservas do usuário
- **Edição de perfil** com atualização de nome, e-mail e foto no Firestore

---

## Estrutura do Projeto

```
VassHotel/
│
├── src/
│   ├── assets/
│   │   └── images.js              # Imagens em base64 (logo e hotéis)
│   ├── config/
│   │   └── firebase.js            # Inicialização Firebase (Auth + Firestore)
│   ├── context/
│   │   └── AuthContext.js         # Estado global de autenticação
│   ├── navigation/
│   │   └── AppNavigator.js        # Rotas e fluxo de navegação
│   ├── screens/
│   │   ├── WelcomeScreen.js       # Tela de login e cadastro
│   │   ├── BiometricLockScreen.js # Bloqueio biométrico ao reabrir
│   │   ├── HotelListScreen.js     # Lista de hotéis + edição de perfil
│   │   ├── HotelDetailScreen.js   # Detalhes do hotel + modal de reserva
│   │   └── ReservationsScreen.js  # Minhas reservas
│   └── services/
│       ├── authService.js         # Firebase Auth (login, cadastro, logout)
│       ├── userService.js         # Perfil do usuário no Firestore
│       ├── hotelService.js        # Hotéis no Firestore + seed inicial
│       └── reservationService.js  # Reservas no Firestore
│
├── App.js
├── app.json
├── package.json
├── babel.config.js
├── .gitignore
└── README.md
```

---

## Banco de Dados (Firestore)

| Coleção        | Campos principais                                                        |
|----------------|--------------------------------------------------------------------------|
| `hotels`       | name, city, state, address, rating, amenities, isAvailable, imageKey     |
| `users/{uid}`  | name, email, photoUri, createdAt                                         |
| `reservations` | userId, hotelId, hotelName, checkIn, checkOut, guests, status, createdAt |

Os hotéis são populados automaticamente no Firestore na primeira execução do app.

---

## Configuração do Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative **Authentication → E-mail/senha**
3. Crie um **Firestore Database** (modo de teste)
4. Registre um app Web e copie o `firebaseConfig`
5. Cole as credenciais em `src/config/firebase.js`

---

## Como Executar

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS) ou rode em um emulador.
