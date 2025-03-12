import pool from './db.js';
//import pokeAPI from './pokeAPI.js';

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
    ownerID INT,
    generation VARCHAR(50),
    pokemon1 INT,
    pokemon2 INT,
    pokemon3 INT,
    pokemon4 INT,
    pokemon5 INT,
    pokemon6 INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
            const {generation, name, description } = req.body;
            const ownerID = req.session.passport.user.userID;
            
            const generationNumber = generation;
            
            const [result] = await pool.query(
                'INSERT INTO teams (ownerID, generation, teamname, description) VALUES (?, ?, ?, ?)',
                [ownerID, generationNumber, name, description]
            );
            
            req.body.teamID = result.insertId;
            res.render("teambuilder", { 
                title: 'Team Builder',
                team: {
                    teamID: result.insertId,
                    teamname: name,
                    description: description,
                    generation: generationNumber
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getTeamsByCurrentUser: async (req) => {
        try {
            const ownerID = req.session.passport.user.userID;
            const conn = await pool.getConnection();   
            const [teams] = await conn.execute(
                'SELECT * FROM teams WHERE ownerID = ? ORDER BY created_at DESC',
                [ownerID]
            );
            pool.releaseConnection(conn);
            return teams;
        } catch (error) {
            console.log('Error fetching teams:', error);
            throw error;
        }
    },


    // Function to fetch complete Pokemon data
    getPokemonData: async (pokemonId) => {
        if (!pokemonId) return null;
        //console.log(`Pokemon ID: ${pokemonId}`);
        const [pokemonData] = await pool.query(`
            SELECT 
                p.generation, p.pokemonID,
                pbd.name, pbd.dexNum, pbd.spriteURL,
                tr1.typeName as typeMain,
                tr2.typeName as typeSecond,
                pcd.gender, pcd.shiny, pcd.nature, 
                pcd.friendship, pcd.ability,
                pm.move1, pm.move2, pm.move3, pm.move4,
                bs.sHealth as baseHP, bs.sAtk as baseAtk, 
                bs.sDef as baseDef, bs.sSpAtk as baseSpAtk,
                bs.sSpDef as baseSpDef, bs.sSpd as baseSpd,
                ev.sHealth as evHP, ev.sAtk as evAtk,
                ev.sDef as evDef, ev.sSpAtk as evSpAtk,
                ev.sSpDef as evSpDef, ev.sSpd as evSpd,
                iv.sHealth as ivHP, iv.sAtk as ivAtk,
                iv.sDef as ivDef, iv.sSpAtk as ivSpAtk,
                iv.sSpDef as ivSpDef, iv.sSpd as ivSpd,
                total.sHealth as totalHP, total.sAtk as totalAtk,
                total.sDef as totalDef, total.sSpAtk as totalSpAtk,
                total.sSpDef as totalSpDef, total.sSpd as totalSpd
            FROM pokemon p
            JOIN poke_base_data pbd ON p.baseDataID = pbd.baseID
            JOIN type_ref tr1 ON pbd.typeMain = tr1.typeID
            LEFT JOIN type_ref tr2 ON pbd.typeSecond = tr2.typeID
            JOIN poke_choice_data pcd ON p.choiceDataID = pcd.choiceID
            JOIN poke_moveset pm ON p.moveSetID = pm.moveSetID
            JOIN stat_list bs ON pbd.baseStatID = bs.statID
            JOIN stat_list ev ON pcd.statEV = ev.statID
            JOIN stat_list iv ON pcd.statIV = iv.statID
            JOIN stat_list total ON pcd.statTotal = total.statID
            WHERE p.pokemonID = ?`,
            [pokemonId]
        );

        if (!pokemonData[0]) return null;

        const formattedData = {
            ...pokemonData[0],
            types: [
                pokemonData[0].typeMain,
                pokemonData[0].typeSecond
            ].filter(Boolean),
            moves: [
                pokemonData[0].move1,
                pokemonData[0].move2, 
                pokemonData[0].move3,
                pokemonData[0].move4
            ].filter(Boolean),
            baseStats: {
                hp: pokemonData[0].baseHP,
                attack: pokemonData[0].baseAtk,
                defense: pokemonData[0].baseDef,
                specialAttack: pokemonData[0].baseSpAtk,
                specialDefense: pokemonData[0].baseSpDef,
                speed: pokemonData[0].baseSpd
            },
            evs: {
                hp: pokemonData[0].evHP,
                attack: pokemonData[0].evAtk,
                defense: pokemonData[0].evDef,
                specialAttack: pokemonData[0].evSpAtk,
                specialDefense: pokemonData[0].evSpDef,
                speed: pokemonData[0].evSpd
            },
            ivs: {
                hp: pokemonData[0].ivHP,
                attack: pokemonData[0].ivAtk,
                defense: pokemonData[0].ivDef,
                specialAttack: pokemonData[0].ivSpAtk,
                specialDefense: pokemonData[0].ivSpDef,
                speed: pokemonData[0].ivSpd
            },
            totalStats: {
                hp: pokemonData[0].totalHP,
                attack: pokemonData[0].totalAtk,
                defense: pokemonData[0].totalDef,
                specialAttack: pokemonData[0].totalSpAtk,
                specialDefense: pokemonData[0].totalSpDef,
                speed: pokemonData[0].totalSpd
            },
            statNames: {
                hp: 'HP',
                attack: 'Attack',
                defense: 'Defense',
                specialAttack: 'Sp. Atk',
                specialDefense: 'Sp. Def',
                speed: 'Speed'
            }
        };

        // Clean up by removing the individual fields that are now in objects
        delete formattedData.typeMain;
        delete formattedData.typeSecond;
        delete formattedData.move1;
        delete formattedData.move2;
        delete formattedData.move3;
        delete formattedData.move4;
        
        // Delete all individual stat fields
        ['baseHP', 'baseAtk', 'baseDef', 'baseSpAtk', 'baseSpDef', 'baseSpd',
         'evHP', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpd',
         'ivHP', 'ivAtk', 'ivDef', 'ivSpAtk', 'ivSpDef', 'ivSpd',
         'totalHP', 'totalAtk', 'totalDef', 'totalSpAtk', 'totalSpDef', 'totalSpd'
        ].forEach(field => delete formattedData[field]);

        return formattedData;
    },

    // Get a specific team by ID with all related data
    getTeamById: async (teamID) => {
        try {
            // Get the base team data
            const [teamRows] = await pool.query(`
                SELECT t.*, u.username as ownerName 
                FROM teams t
                JOIN user u ON t.ownerID = u.userID
                WHERE t.teamID = ?`,
                [teamID]
            );
            
            if (teamRows.length === 0) {
                throw new Error('Team not found');
            }

            const team = teamRows[0];
            
            // Fetch data for all Pokemon in the team
            team.pokemon = await Promise.all([
                teamController.getPokemonData(team.pokemon1),
                teamController.getPokemonData(team.pokemon2),
                teamController.getPokemonData(team.pokemon3),
                teamController.getPokemonData(team.pokemon4),
                teamController.getPokemonData(team.pokemon5),
                teamController.getPokemonData(team.pokemon6)
            ]);

            // Clean up the response by removing the individual pokemon fields
            delete team.pokemon1;
            delete team.pokemon2;
            delete team.pokemon3;
            delete team.pokemon4;
            delete team.pokemon5;
            delete team.pokemon6;
            //console.log(team)
            return team;
        } catch (error) {
            console.error('Error fetching team:', error);
            throw error;
        }
    },

    // Update a team
    updateTeam: async (req, res) => {
        try {
            const { teamID, generation, teamname, description, pokemon1, pokemon2, pokemon3, pokemon4, pokemon5, pokemon6 } = req.body;
            
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
    deleteTeam: async (teamID) => {
        try {
            const [result] = await pool.query(
                'DELETE FROM teams WHERE teamID = ?',
                [teamID]
            );
            
            if (result.affectedRows === 0) {
                throw new Error('Team not found');
            }
            
            return result;
        } catch (error) {
            console.error('Error deleting team:', error);
            throw error;
        }
    }
};

export default teamController;


