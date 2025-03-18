
# Sentinel Cybersecurity Dashboard

## Overview

Sentinel is a real-time cybersecurity monitoring dashboard that provides visibility into network threats, attacks, and security incidents. The dashboard connects to security APIs and leverages blockchain technology for immutable record-keeping of security events.

![Sentinel Dashboard](public/og-image.png)

## Features

### Real-time Threat Monitoring
- Live attack feed with filtering options
- Severity-based threat categorization (High, Medium, Low)
- Geographic visualization of attack sources
- Automatic alerts for critical security events

### Blockchain Security Ledger
- Immutable record of security incidents
- Cryptographically verified security event chain
- Historical view of all recorded security incidents
- Detailed block information with expandable views

### Analytics & Reporting
- Threat statistics and metrics
- Attack trend analysis over time
- Attack type distribution charts
- Severity breakdown visualizations

### System Integration
- Connects to external threat intelligence APIs
- Blockchain connectivity for verification
- Customizable connection settings
- Fallback to sample data when APIs are unavailable

## Technical Details

### Architecture
The application is built with a modern React architecture using TypeScript for type safety. It employs a feature-based folder structure for better organization and maintainability. The UI is built with shadcn/ui components and Tailwind CSS for styling.

### Key Components

- **Threat Monitoring**: Real-time data visualization of security threats
- **Blockchain Ledger**: Immutable record-keeping of security events
- **Error Handling**: Graceful degradation with fallback data
- **Connection Status**: Clear indicators of system connectivity

### Data Sources
The dashboard connects to two primary data sources:

1. **Threat Intelligence API**: Provides real-time security threat data
2. **Blockchain API**: Provides immutable verification of security events

Both connections are configurable through the settings panel, and the system will automatically attempt to reconnect if connections are lost.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Configuration
To connect to your data sources:

1. Click the settings icon in the header
2. Enter your API key (if required)
3. Enter your Threat API URL
4. Enter your Blockchain URL
5. Click Connect

### Development
The project uses Vite for fast development and building. Key commands:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/      # Generic UI components
├── features/        # Feature-specific components
│   ├── blockchain/  # Blockchain viewer components
│   ├── feeds/       # Live attack feed components
│   ├── settings/    # Settings and configuration components
│   └── stats/       # Statistics and metrics components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── pages/           # Application pages
└── utils/           # Utility functions
```

## Error Handling

The application is designed to handle various error conditions gracefully:

- **Connection failures**: Falls back to sample data
- **API timeout**: Automatically attempts to reconnect
- **Data format errors**: Provides meaningful error messages
- **Partial connectivity**: Functions with limited data sources

## Security Features

- Secure connection settings
- Real-time threat alerts
- High severity notifications
- Connection status monitoring
- Immutable security records

## License

This project is licensed under the MIT License - see the LICENSE file for details.
