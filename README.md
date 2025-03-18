# PokéBuilder - Pokémon Team Building Application

## Overview
PokéBuilder is a web application that allows users to create, save, and manage Pokémon teams. Whether you're a beginner getting into Pokémon team building or a current player planning your in-game teams, PokéBuilder provides an intuitive interface to explore Pokémon and build your dream teams.

## Features
- **User Account Management**
  - Create a new account
  - Sign in to access personal data
  - Secure authentication using Passport.js

- **Pokémon Team Building**
  - Create multiple teams
  - Add up to six Pokémon per team
  - Edit existing teams (swap or remove Pokémon)
  - Save teams to your account

- **Pokémon Search**
  - Search Pokémon by name
  - Filter Pokémon by generation
  - Filter Pokémon by type
  - Access detailed information about each Pokémon

- **Pokédex Feature**
  - Browse a comprehensive list of all Pokémon
  - View detailed Pokémon information including:
    - Types
    - Abilities
    - Base stats
    - Moves
    - Evolution chains


## Usage

### Creating an Account
1. Navigate to the Sign Up page
2. Fill in your username, email, and password
3. Click "Create Account"

### Building a Team
1. Log in to your account
2. Go to the "Create Team" page
3. Search for Pokémon using the search bar or filters
4. Click on a Pokémon to view its details
5. Add the Pokémon to your team
6. After adding up to six Pokémon, save your team with a custom name

### Managing Teams
1. Navigate to "My Teams" page
2. View all your saved teams
3. Edit teams by adding/removing Pokémon or changing team name
4. Delete teams you no longer want

## Technologies Used

### Backend
- Node.js
- Express.js
- MySQL
- Passport.js (authentication)
- PokéAPI (via pokedex-promise-v2)

### Frontend
- EJS templates
- Tailwind CSS
- JavaScript

## API Integration
PokéBuilder uses the PokéAPI to fetch Pokémon data. The application integrates with this API through the pokedex-promise-v2 package to provide up-to-date information about all Pokémon, including their types, abilities, moves, and more.

## Future Enhancements
- Team analysis for strengths and weaknesses
- Sharing teams with other users
- Adding competitive battle statistics

## Contributors
- Conor Driscoll
- Adrian Czerwonka
- Idrees Abdurrazzak