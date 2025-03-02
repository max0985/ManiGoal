# ManiGoal - Goal Manifestation App

A mobile application that helps users manifest their goals through AI-assisted planning, vision boards, and progress tracking.

## Features

- User Authentication
- Goal Management
- Vision Board
- AI Assistant
- Progress Tracking
- Daily Inspirational Quotes

## Tech Stack

- Frontend: React Native with TypeScript
- Backend: Supabase
- UI Framework: React Native Paper
- AI Processing: DeepSeek
- Navigation: Expo Router

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Supabase Account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/manigoal.git
cd manigoal
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npx expo start
```

## Database Setup

1. Create a new Supabase project
2. Run the following SQL commands in your Supabase SQL editor to create the necessary tables:

```sql
-- Create tables for users, goals, milestones, vision board items, daily quotes, and chat history
-- (SQL commands can be found in docs/CONTEXT.md)
```

## Development

- `app/` - Contains all the screens and navigation logic
- `components/` - Reusable React components
- `lib/` - Utility functions and configurations
- `styles/` - Global styles and theme configuration
- `types/` - TypeScript type definitions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 