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
- React Native Maps (localização do hotel no mapa)
- React Native Community DateTimePicker (seleção de datas de reserva)
- Maestro (testes E2E automatizados)

---

## Funcionalidades

- **Cadastro e login** com e-mail e senha via Firebase Authentication
- **Autenticação biométrica** (digital / Face ID) ao reabrir o app
- **Catálogo de hotéis** carregado do Firestore com busca e pull-to-refresh
- **Detalhes do hotel** com mapa, avaliação, comodidades e contato
- **Reservas** com seleção de datas por calendário nativo e número de hóspedes
- **Minhas Reservas** - listagem, edição e cancelamento de reservas do usuário, com confirmação visual a cada ação
- **Edição de perfil** com atualização de nome, e-mail, foto e senha no Firestore/Firebase Auth

---

## Estrutura do Projeto

```
VassHotel/
│
├── .maestro/                       # Testes E2E (Maestro)
│   ├── helpers/
│   │   └── login_helper.yaml      # Fluxo de login reutilizável
│   ├── 01_boas_vindas.yaml
│   ├── 02_login.yaml
│   ├── 03_login_invalido.yaml
│   ├── 04_lista_hoteis.yaml
│   ├── 05_pesquisa_hoteis.yaml
│   ├── 06_detalhe_hotel.yaml
│   ├── 07_gerenciar_reservas.yaml  # Reservar, ver, editar e cancelar
│   ├── 08_logout.yaml
│   └── 99_fluxo_completo.yaml      # Jornada completa em uma única execução
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
2. Ative **Authentication > E-mail/senha**
3. Crie um **Firestore Database** (modo de teste)
4. Registre um app Web e copie o `firebaseConfig`
5. Cole as credenciais em `src/config/firebase.js`

---

## Configuração do Google Maps (Android)

A tela de detalhes do hotel usa `react-native-maps`, que no Android exige uma chave da **Maps SDK for Android** configurada em `app.json` (`android.config.googleMaps.apiKey`). Sem essa chave, o build standalone/dev-client do app trava ao abrir a tela do mapa com o erro "API key not found".

> No iOS o mapa usa Apple Maps via `PROVIDER_DEFAULT` e não exige chave nenhuma.

Enquanto a chave não estiver configurada, use o **Expo Go** para desenvolvimento e testes - ele já vem com uma chave de mapas própria para uso em desenvolvimento, então o mapa funciona normalmente sem nenhuma configuração extra. É por isso que os testes Maestro deste projeto rodam via Expo Go (veja a seção abaixo).

---

## Como Executar

```bash
npm install
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS) ou rode em um emulador.

---

## Testes Automatizados (Maestro)

Os testes E2E em `.maestro/` rodam o app dentro do **Expo Go** (não no build standalone), via deep link `exp://`, para evitar a necessidade de uma chave do Google Maps configurada.

### Dependências

- [Maestro CLI](https://maestro.mobile.dev) instalado (`curl -Ls "https://get.maestro.mobile.dev" | bash`)
- Um emulador Android (ou dispositivo físico) com **Expo Go** instalado
- Projeto rodando localmente via Metro (`npx expo start`)

### Preparando o ambiente

```bash
npm install
npx expo start --port 8081
```

Com o emulador já aberto e conectado (`adb devices`), encaminhe a porta do Metro para o dispositivo:

```bash
adb reverse tcp:8081 tcp:8081
```

### Executando os testes

Cada flow é independente e já cuida de abrir o Expo Go, carregar o projeto e fazer login quando necessário:

```bash
# Um flow específico
maestro test .maestro/02_login.yaml

# Jornada completa (login > busca > reserva > editar > cancelar > logout) em uma única execução
maestro test .maestro/99_fluxo_completo.yaml
```

> Os flows usam `clearState: true`, o que reseta os dados do Expo Go (incluindo o menu de desenvolvedor, que pode reaparecer e exigir um toque para ser dispensado — já tratado nos flows). As credenciais de teste padrão são `teste@vasshotel.com` / `teste123456`.
