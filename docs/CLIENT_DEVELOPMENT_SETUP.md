# ⚛️ Client Development Setup (Local)

This guide explains how to set up the React client (`client/client_v4`) for local development on your laptop.

## 📋 Prerequisites

### Required Software
- **Node.js** (v18+ recommended)
- **npm** or **pnpm** (package manager)
- **Git**
- **Modern Browser** (Chrome, Firefox, Safari, Edge)

### Installation Commands

#### Ubuntu/Debian
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm (recommended)
npm install -g pnpm

# Verify installation
node --version
pnpm --version
```

#### macOS
```bash
# Install Node.js via Homebrew
brew install node pnpm

# Or via official installer
# Download from: https://nodejs.org/

# Verify installation
node --version
pnpm --version
```

#### Windows
```bash
# Download and install Node.js from: https://nodejs.org/
# Then install pnpm
npm install -g pnpm
```

## 🚀 Client Setup

### 1. Navigate to Client Directory
```bash
cd community_coin_server/client/client_v4/project
```

### 2. Install Dependencies
```bash
# Install all dependencies
pnpm install

# Or using npm
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project directory:

```bash
# client/client_v4/project/.env.local

# Solana Configuration
VITE_SOLANA_RPC_URL=http://localhost:8899
VITE_SOLANA_WS_URL=ws://localhost:8900
VITE_SOLANA_NETWORK=localnet
VITE_COMMCOIN_PROGRAM_ID=6YuHH4kveCrEeEtVKM2nh18zU4XWFpEWqV8f5GbhdnzX

# Server Configuration
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

# App Configuration
VITE_APP_NAME="Community Coin"
VITE_APP_DESCRIPTION="Decentralized Community Token Platform"
VITE_ENVIRONMENT=development
```

### 4. Start Development Server
```bash
# Start the development server
pnpm dev

# Or using npm
npm run dev

# The app will be available at http://localhost:5173
```

## ✅ Verification

### 1. Basic Functionality
- Open http://localhost:5173 in your browser
- You should see the Community Coin interface
- No console errors should appear

### 2. Wallet Integration
- Click "Connect Wallet" button
- Select a wallet adapter (Phantom recommended for testing)
- Wallet should connect successfully

### 3. Server Integration
- Check that API calls work (user data, tokens, etc.)
- Verify WebSocket connection for real-time updates

## 🔧 Development Features

### Hot Module Replacement (HMR)
The development server supports hot reloading:
- Save any file to see changes instantly
- React components update without losing state
- CSS changes apply immediately

### TypeScript Support
Full TypeScript integration:
- Type checking during development
- IntelliSense in VS Code
- Compile-time error detection

### Modern React Features
- React 18 with concurrent features
- React Router for navigation
- Zustand for state management
- React Query for API calls

## 📊 Client Architecture

### Key Technologies
- **React 18** - UI framework with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing

### Solana Integration
- **@solana/web3.js** - Solana JavaScript SDK
- **@solana/wallet-adapter-react** - Wallet integration
- **@solana/spl-token** - SPL token operations
- **Anchor** - Smart contract interaction

### UI Components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Recharts** - Chart and graph components

## 🗂️ Project Structure

```
client/client_v4/project/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   │   ├── wallet/         # Wallet-related components
│   │   ├── trading/        # Trading interface components
│   │   └── social/         # Social features components
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Trading.tsx
│   │   ├── Profile.tsx
│   │   └── TokenDetails.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useWallet.ts
│   │   ├── useApi.ts
│   │   └── useSolana.ts
│   ├── store/              # Zustand stores
│   │   ├── walletStore.ts
│   │   ├── userStore.ts
│   │   └── tokenStore.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── api.ts
│   │   ├── solana.ts
│   │   └── user.ts
│   ├── utils/              # Utility functions
│   │   ├── solana.ts
│   │   ├── api.ts
│   │   └── format.ts
│   ├── api/                # API integration
│   │   └── client.ts
│   ├── idls/               # Anchor IDL files
│   │   └── commcoin.json
│   └── styles/             # Global styles
│       └── globals.css
├── public/                 # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Create a new branch
git checkout -b feature/new-feature

# Start development server
pnpm dev

# Make changes and test
# The browser will auto-reload with changes

# Build for testing
pnpm build
pnpm preview
```

### 2. Component Development
```bash
# Create new component
mkdir src/components/MyComponent
touch src/components/MyComponent/MyComponent.tsx
touch src/components/MyComponent/index.ts

# Add to component exports
echo "export { default } from './MyComponent';" > src/components/MyComponent/index.ts
```

### 3. State Management
```typescript
// Create new store (src/store/myStore.ts)
import { create } from 'zustand';

interface MyState {
  data: any[];
  setData: (data: any[]) => void;
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));
```

### 4. API Integration
```typescript
// Add API methods (src/api/client.ts)
export const apiClient = {
  async getMyData() {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/my-data`);
    return response.json();
  },
};
```

## 🧪 Testing

### 1. Build Testing
```bash
# Test production build
pnpm build

# Preview production build
pnpm preview

# Check for build errors
pnpm build 2>&1 | grep -i error
```

### 2. Type Checking
```bash
# Run TypeScript compiler check
npx tsc --noEmit

# Check for linting issues
pnpm lint
```

### 3. Manual Testing Checklist
- [ ] Wallet connection works
- [ ] All pages load without errors
- [ ] API calls return data
- [ ] WebSocket connections establish
- [ ] Real-time updates work
- [ ] Responsive design works on mobile
- [ ] Dark/light mode toggle works

## 🔗 Integration Points

### With Server (`server_rust`)
- **API Endpoints**: All 78+ endpoints available
- **WebSocket**: Real-time updates for market data, notifications
- **Authentication**: JWT-based auth with wallet signatures

### With Contracts (`commcoin`)
- **Direct Connection**: Client connects directly to Solana RPC
- **Program Interaction**: Uses Anchor-generated types
- **Transaction Signing**: Wallet adapter handles all signing

### External Services
- **Solana RPC**: Direct blockchain interaction
- **Wallet Providers**: Phantom, Solflare, Ledger, etc.

## 🐛 Troubleshooting

### Common Issues

#### "Module not found" Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or for npm
rm -rf node_modules package-lock.json
npm install
```

#### Wallet Connection Issues
```bash
# Check if wallet extension is installed
# Ensure wallet is unlocked
# Check browser console for errors
# Verify SOLANA_RPC_URL is correct
```

#### Build Errors
```bash
# Check TypeScript errors
npx tsc --noEmit

# Check for dependency conflicts
pnpm ls --depth=0

# Update dependencies
pnpm update
```

#### Hot Reload Not Working
```bash
# Restart development server
# Check file permissions
# Verify vite.config.ts is correct
```

#### Environment Variables Not Loading
```bash
# Ensure .env.local exists
# Check variable names start with VITE_
# Restart development server after changes
```

## 🎨 Styling & Theming

### Tailwind CSS
The project uses Tailwind CSS for styling:

```bash
# Tailwind config is in tailwind.config.js
# Custom styles in src/styles/globals.css
# Component-specific styles using Tailwind classes
```

### Dark Mode
Built-in dark mode support:
```typescript
// Toggle dark mode
const { theme, setTheme } = useTheme();
setTheme(theme === 'dark' ? 'light' : 'dark');
```

### Responsive Design
Mobile-first responsive design:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

## 📱 Browser Support

### Supported Browsers
- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Required Features
- ES2020 support
- WebSocket support
- Local Storage
- IndexedDB (for wallet data)

## 🚀 Performance Optimization

### Code Splitting
```typescript
// Lazy load components
const LazyComponent = lazy(() => import('./components/LazyComponent'));

// Use with Suspense
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

### Bundle Analysis
```bash
# Analyze bundle size
pnpm build
pnpm run analyze

# Check for large dependencies
npx vite-bundle-analyzer dist
```

## 📝 Development Tips

### 1. VS Code Extensions
Recommended extensions:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Auto Rename Tag
- Prettier

### 2. Browser DevTools
- React Developer Tools
- Redux DevTools (for Zustand)
- Solana Wallet Adapter DevTools

### 3. Debugging
```typescript
// Enable debug logging
localStorage.setItem('debug', 'wallet-adapter:*');

// Check Zustand store state
console.log(useMyStore.getState());
```

## 📚 Resources

- **React Documentation**: https://react.dev/
- **Vite Documentation**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **Wallet Adapter**: https://github.com/solana-labs/wallet-adapter

## 📝 Next Steps

1. **Set up the server**: See `docs/SERVER_DEVELOPMENT_SETUP.md`
2. **Set up contracts**: See `docs/CONTRACTS_DEVELOPMENT_SETUP.md`
3. **Full E2E testing**: Use `scripts/setup-localnet-e2e.sh`
4. **Production deployment**: See `docs/MULTI_CLOUD_DEPLOYMENT.md`

---

💡 **Tip**: Use the E2E setup script to run the complete development stack automatically. 