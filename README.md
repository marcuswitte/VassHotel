# VassHotel

Projeto desenvolvido na disciplina **Laboratório de Desenvolvimento de Aplicativos Híbridos**.

O objetivo do aplicativo é permitir a exploração e reserva de hotéis da rede fictícia VassHotel, onde usuários podem criar conta, navegar pelo catálogo de hotéis e visualizar detalhes de cada unidade.

---

# Tecnologias Utilizadas

- JavaScript
- React Native
- Expo
- React Navigation
- AsyncStorage
- Git

---

# Estrutura do Projeto

```
VassHotel/
│
├── src/
│   ├── assets/
│   │   └── images.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── data/
│   │   └── hotels.js
│   ├── navigation/
│   │   └── AppNavigator.js
│   └── screens/
│       ├── WelcomeScreen.js
│       ├── BiometricLockScreen.js
│       ├── HotelListScreen.js
│       └── HotelDetailScreen.js
│
├── App.js
├── app.json
├── package.json
├── babel.config.js
├── .gitignore
└── README.md
```

---

# Como Executar

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS) ou rode em um emulador.
