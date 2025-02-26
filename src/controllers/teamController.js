import pool from './db.js';
import pokeAPI from './pokeAPI.js';

/*

-- Stat List Table
CREATE TABLE stat_list (
    statID INT PRIMARY KEY AUTO_INCREMENT,
    statType VARCHAR(50),
    sHealth INT,
    sDef INT,
    sSpDef INT,
    sAtk INT,
    sSpAtk INT,
    sSpd INT
);

-- Pokemon Base Data Table
CREATE TABLE poke_base_data (
    baseID INT PRIMARY KEY AUTO_INCREMENT,
    dexNum INT,
    name VARCHAR(100),
    typeMain INT,
    typeSecond INT,
    baseStatID INT,
    FOREIGN KEY (typeMain) REFERENCES type_ref(typeID),
    FOREIGN KEY (typeSecond) REFERENCES type_ref(typeID),
    FOREIGN KEY (baseStatID) REFERENCES stat_list(statID)
);

-- Pokemon Choice Data Table
CREATE TABLE poke_choice_data (
    choiceID INT PRIMARY KEY AUTO_INCREMENT,
    gender VARCHAR(10),
    shiny BIT,
    nature VARCHAR(50),
    friendship INT,
    ability VARCHAR(100),
    statEV INT,
    statIV INT,
    statTotal INT,
    FOREIGN KEY (statEV) REFERENCES stat_list(statID),
    FOREIGN KEY (statIV) REFERENCES stat_list(statID),
    FOREIGN KEY (statTotal) REFERENCES stat_list(statID)
);

-- Pokemon Move Set Table
CREATE TABLE poke_moveset (
    moveSetID INT PRIMARY KEY AUTO_INCREMENT,
    move1 VARCHAR(100),
    move2 VARCHAR(100),
    move3 VARCHAR(100),
    move4 VARCHAR(100)
);

-- Pokemon Table
CREATE TABLE pokemon (
    pokemonID INT PRIMARY KEY AUTO_INCREMENT,
    generation VARCHAR(50),
    baseDataID INT,
    choiceDataID INT,
    moveSetID INT,
    FOREIGN KEY (baseDataID) REFERENCES poke_base_data(baseID),
    FOREIGN KEY (choiceDataID) REFERENCES poke_choice_data(choiceID),
    FOREIGN KEY (moveSetID) REFERENCES poke_moveset(moveSetID)
);

-- Teams Table
CREATE TABLE teams (
    teamID INT PRIMARY KEY AUTO_INCREMENT,
    ownerID INT NOT NULL,
    generation VARCHAR(50),
    pokemon1 INT,
    pokemon2 INT,
    pokemon3 INT,
    pokemon4 INT,
    pokemon5 INT,
    pokemon6 INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(45),
    description MEDIUMTEXT,
    FOREIGN KEY (ownerID) REFERENCES user(userID),
    FOREIGN KEY (pokemon1) REFERENCES pokemon(pokemonID),
    FOREIGN KEY (pokemon2) REFERENCES pokemon(pokemonID),
    FOREIGN KEY (pokemon3) REFERENCES pokemon(pokemonID),
    FOREIGN KEY (pokemon4) REFERENCES pokemon(pokemonID),
    FOREIGN KEY (pokemon5) REFERENCES pokemon(pokemonID),
    FOREIGN KEY (pokemon6) REFERENCES pokemon(pokemonID)
);
*/

const teamController = {
    // Create a new team
    createTeam: async (req, res) => {
        try {
            const { ownerID, generation, name, description } = req.body;

            const [result] = await pool.query(
                'INSERT INTO teams (ownerID, generation, name, description) VALUES (?, ?, ?, ?)',
                [ownerID, generation, name, description]
            );
            
            res.status(201).json({ 
                message: 'Team created successfully',
                teamID: result.insertId 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get all teams for a specific user
    getTeamsByUser: async (req, res) => {
        try {
            const { ownerID } = req.params;
            
            const [teams] = await pool.query(
                'SELECT * FROM teams WHERE ownerID = ? ORDER BY created_at DESC',
                [ownerID]
            );
            
            res.status(200).json(teams);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get a specific team by ID
    getTeamById: async (req, res) => {
        try {
            const { teamID } = req.params;
            
            const [team] = await pool.query(
                'SELECT * FROM teams WHERE teamID = ?',
                [teamID]
            );
            
            if (team.length === 0) {
                return res.status(404).json({ message: 'Team not found' });
            }
            
            res.status(200).json(team[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Update a team
    updateTeam: async (req, res) => {
        try {
            const { teamID } = req.params;
            const { generation, teamname, description, pokemon1, pokemon2, pokemon3, pokemon4, pokemon5, pokemon6 } = req.body;
            
            const [result] = await pool.query(
                `UPDATE teams 
                SET generation = ?,teamname = ?, description = ?, pokemon1 = ?, pokemon2 = ?, pokemon3 = ?, 
                    pokemon4 = ?, pokemon5 = ?, pokemon6 = ? 
                WHERE teamID = ?`,
                [generation, teamname, description, pokemon1, pokemon2, pokemon3, pokemon4, pokemon5, pokemon6, teamID]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Team not found' });
            }
            
            res.status(200).json({ message: 'Team updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Delete a team
    deleteTeam: async (req, res) => {
        try {
            const { teamID } = req.params;
            
            const [result] = await pool.query(
                'DELETE FROM teams WHERE teamID = ?',
                [teamID]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Team not found' });
            }
            
            res.status(200).json({ message: 'Team deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

export default teamController;


