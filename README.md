# 1inch Pro Hub

## Overview

The 1inch Pro Hub is a sophisticated cryptocurrency trading platform that integrates with the 1inch DEX aggregator API to provide advanced trading features. It's built as a full-stack application with a React frontend and Express backend, featuring real-time data updates via WebSocket connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

- **Frontend**: React-based SPA using Vite as the build tool
- **Backend**: Express.js REST API server with WebSocket support
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **UI Framework**: Shadcn/ui components with Tailwind CSS styling
- **State Management**: TanStack Query for server state and caching

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for development and production
- **Styling**: Tailwind CSS with custom design system (New York style from Shadcn/ui)
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for API data management
- **UI Components**: Comprehensive set of Radix UI-based components via Shadcn/ui

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Integration**: Custom service layer for 1inch API interactions
- **Real-time Communication**: WebSocket server for live price updates and notifications
- **Data Storage**: In-memory storage with interface for future database integration
- **Authentication**: Basic username/password system (ready for expansion)

### Database Schema
The application uses Drizzle ORM with PostgreSQL and includes tables for:
- **Users**: Authentication and wallet management
- **Portfolios**: Asset holdings and portfolio values
- **Strategies**: Trading automation configurations (DCA, stop-loss, etc.)
- **Swap Transactions**: Trading history and transaction tracking
- **Cross-Chain Bridges**: Multi-chain transaction management

### Trading Features
- **Token Swapping**: Integration with 1inch's classic swap API
- **Fusion+ Trading**: Support for cross-chain transactions via 1inch Fusion+
- **Strategy Automation**: DCA, stop-loss, take-profit, and grid trading strategies
- **Portfolio Analytics**: Real-time portfolio tracking and performance metrics
- **Risk Assessment**: AI-powered risk analysis and trading insights

## Data Flow

1. **Authentication Flow**: Users register/login → backend validates → session management
2. **Trading Flow**: User initiates swap → quote from 1inch API → transaction execution → portfolio update
3. **Real-time Updates**: WebSocket connection provides live price feeds and portfolio updates
4. **Strategy Execution**: Automated strategies monitor conditions and execute trades
5. **Portfolio Management**: Real-time asset tracking with value calculations

## External Dependencies

### Core APIs
- **1inch API**: Primary DEX aggregator for swap quotes and transaction execution
- **WebSocket Services**: Real-time price feeds and market data
- **Blockchain RPCs**: Direct interaction with supported chains (Ethereum, Arbitrum, Polygon, BSC, Avalanche)

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling framework
- **Class Variance Authority**: Component variant management

### Development Tools
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast bundling for production builds
- **Drizzle Kit**: Database migration management
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development Environment
- Vite dev server with HMR for frontend development
- Express server with TypeScript execution via tsx
- In-memory storage for rapid prototyping
- WebSocket integration for real-time features

### Production Build
- Frontend: Vite builds optimized static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Database: Drizzle migrations handle schema updates
- Environment: Configured for PostgreSQL via DATABASE_URL

### Architecture Decisions

**Monorepo Structure**: Single repository with shared types and schemas between client and server for type safety and code reuse.

**In-Memory Storage**: Current implementation uses in-memory storage with a well-defined interface, making it easy to swap to PostgreSQL later without changing business logic.

**WebSocket Integration**: Real-time features are essential for trading applications, so WebSocket support is built into the core architecture.

**Component-First UI**: Shadcn/ui provides a solid foundation of accessible, customizable components while maintaining design consistency.

**API-First Backend**: Clean separation between API routes and business logic, with services handling external integrations like 1inch.

**Type Safety**: Full TypeScript coverage with shared schemas using Drizzle-Zod for runtime validation and compile-time type checking.
# DeFi Trading Hub

A comprehensive DeFi trading platform with advanced security features, cross-chain swaps, and strategy automation.

## Features

- **Cross-Chain Swaps**: Support for EVM and non-EVM chains using 1inch Fusion+ protocol
- **Advanced Security**: Multi-layer security with smart locks, transaction limits, and AI-powered threat detection
- **Strategy Automation**: DCA, limit orders, portfolio rebalancing, and custom strategies
- **Real-time Updates**: WebSocket integration for live price feeds and security alerts
- **Portfolio Analytics**: Comprehensive portfolio tracking and risk assessment

## Environment Setup

### For Replit (Current Setup)

The project is already configured for Replit. Environment variables are set in the `.env` file.

### For VS Code / Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd defi-trading-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   
   Create a `.env` file in the root directory (same level as package.json):
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your API keys:
   ```env
   # 1inch API Configuration
   VITE_ONEINCH_API_KEY=your_1inch_api_key
   VITE_ONEINCH_BASE_URL=https://api.1inch.dev
   
   # WebSocket Configuration
   VITE_WS_URL=ws://localhost:5000
   
   # Security Configuration
   VITE_ENABLE_SECURITY_LOGGING=true
   VITE_MAX_TRANSACTION_LIMIT=10000
   
   # Development Settings
   NODE_ENV=development
   PORT=5000
   ```

4. **Get API Keys**
   
   - **1inch API**: Visit [1inch Developer Portal](https://portal.1inch.dev/) to get your API key
   - **Infura/Alchemy**: For additional RPC endpoints (optional)
   - **WalletConnect**: For wallet integration (optional)

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## File Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and constants
│   │   └── pages/          # Page components
├── server/                 # Backend Express server
│   ├── services/           # Business logic services
│   └── routes.ts           # API routes
├── .env                    # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
└── package.json           # Dependencies and scripts
```

## Security Features

- **Transaction Limits**: Daily, monthly, and per-transaction limits
- **Smart Lock**: AI-powered suspicious activity detection
- **Address Management**: Whitelist/blacklist addresses
- **Time Restrictions**: Limit trading to specific hours
- **2FA Support**: Two-factor authentication
- **Anti-Phishing**: Custom security codes

## API Integration

The platform integrates with:
- **1inch API**: For swaps, limit orders, and portfolio data
- **1inch Fusion+**: For cross-chain swaps
- **Real-time WebSocket**: For live updates

## Development

### Adding New Chains

1. Update `SUPPORTED_CHAINS` in `client/src/lib/constants.ts`
2. Add chain configuration in `FusionPlusInterface` component
3. Update server-side chain handling in `services/oneinch-api.ts`

### Adding New Strategies

1. Create strategy component in `client/src/components/strategies/`
2. Add strategy template to `STRATEGY_TEMPLATES` in constants
3. Implement strategy logic in `StrategyBuilder` component

## Deployment

The project is configured for Replit deployment. For other platforms:

1. Set environment variables in your hosting platform
2. Build the project: `npm run build`
3. Serve the built files from `dist/public`
4. Ensure the backend server runs on the specified PORT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
