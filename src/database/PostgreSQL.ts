import {IDatabase, DbLoadCallback} from './IDatabase';
import {Game, GameId, GameOptions, Score} from '../Game';
import {IGameData} from './IDatabase';
import {SerializedGame} from '../SerializedGame';

import {Pool, ClientConfig, QueryResult} from 'pg';

export class PostgreSQL implements IDatabase {
  private client: Pool;

  constructor() {
    const config: ClientConfig = {
      connectionString: process.env.POSTGRES_HOST,
    };
    if (config.connectionString !== undefined && config.connectionString.startsWith('postgres')) {
      config.ssl = {
        // heroku uses self-signed certificates
        rejectUnauthorized: false,
      };
    }
    this.client = new Pool(config);
    this.client.query('CREATE TABLE IF NOT EXISTS games(game_id varchar, players integer, save_id integer, game text, status text default \'running\', created_time timestamp default now(), PRIMARY KEY (game_id, save_id))', (err) => {
      if (err) {
        throw err;
      }
    });
    this.client.query('CREATE TABLE IF NOT EXISTS game_results(game_id varchar not null, seed_game_id varchar, players integer, generations integer, game_options text, scores text, PRIMARY KEY (game_id))', (err) => {
      if (err) {
        throw err;
      }
    });

    this.client.query('CREATE INDEX IF NOT EXISTS games_i1 on games(save_id)', (err) => {
      if (err) {
        throw err;
      }
    });
    this.client.query('CREATE INDEX IF NOT EXISTS games_i2 on games(created_time )', (err) => {
      if (err) {
        throw err;
      }
    });
  }

  getClonableGames(cb: (err: Error | undefined, allGames: Array<IGameData>) => void) {
    const allGames: Array<IGameData> = [];
    const sql = 'SELECT distinct game_id game_id, players players FROM games WHERE save_id = 0 order by game_id asc';

    this.client.query(sql, (err, res) => {
      if (err) {
        console.error('PostgreSQL:getClonableGames', err);
        cb(err, []);
        return;
      }
      for (const row of res.rows) {
        const gameId: GameId = row.game_id;
        const playerCount: number = row.players;
        const gameData: IGameData = {
          gameId,
          playerCount,
        };
        allGames.push(gameData);
      }
      cb(undefined, allGames);
    });
  }

  getGames(cb: (err: Error | undefined, allGames: Array<GameId>) => void) {
    const allGames: Array<GameId> = [];
    const sql: string = 'SELECT games.game_id FROM games, (SELECT max(save_id) save_id, game_id FROM games WHERE status=\'running\' GROUP BY game_id) a WHERE games.game_id = a.game_id AND games.save_id = a.save_id ORDER BY created_time DESC';
    this.client.query(sql, (err, res) => {
      if (err) {
        console.error('PostgreSQL:getGames', err);
        cb(err, []);
        return;
      }
      for (const row of res.rows) {
        allGames.push(row.game_id);
      }
      cb(undefined, allGames);
    });
  }

  restoreReferenceGame(game_id: GameId, game: Game, cb: (err: any) => void) {
    // Retrieve first save from database
    this.client.query('SELECT game_id game_id, game game FROM games WHERE game_id = $1 AND save_id = 0', [game_id], (err: Error | undefined, res) => {
      if (err) {
        console.error('PostgreSQL:restoreReferenceGame', err);
        return cb(err);
      }
      if (res.rows.length === 0) {
        return cb(new Error('Game not found'));
      }
      try {
        // Transform string to json
        const gameToRestore = JSON.parse(res.rows[0].game);

        // Rebuild each objects
        game.loadFromJSON(gameToRestore);
      } catch (exception) {
        console.error(`Unable to restore game ${game_id}`, exception);
        cb(exception);
        return;
      }
      return cb(undefined);
    });
  }

  getGame(game_id: GameId, cb: (err: Error | undefined, game?: SerializedGame) => void): void {
    // Retrieve last save from database
    this.client.query('SELECT game game FROM games WHERE game_id = $1 ORDER BY save_id DESC LIMIT 1', [game_id], (err, res) => {
      if (err) {
        console.error('PostgreSQL:getGame', err);
        return cb(err);
      }
      if (res.rows.length === 0) {
        return cb(new Error('Game not found'));
      }
      cb(undefined, JSON.parse(res.rows[0].game));
    });
  }

  getGameVersion(game_id: GameId, save_id: number, cb: DbLoadCallback<SerializedGame>): void {
    this.client.query('SELECT game game FROM games WHERE game_id = $1 and save_id = $2', [game_id, save_id], (err: Error | null, res: QueryResult<any>) => {
      if (err) {
        console.error('PostgreSQL:getGameVersion', err);
        return cb(err, undefined);
      }
      cb(undefined, JSON.parse(res.rows[0].game));
    });
  }

  saveGameResults(game_id: GameId, players: number, generations: number, gameOptions: GameOptions, scores: Array<Score>): void {
    this.client.query('INSERT INTO game_results (game_id, seed_game_id, players, generations, game_options, scores) VALUES($1, $2, $3, $4, $5, $6)', [game_id, gameOptions.clonedGamedId, players, generations, gameOptions, JSON.stringify(scores)], (err) => {
      if (err) {
        console.error('PostgreSQL:saveGameResults', err);
        throw err;
      }
    });
  }

  cleanSaves(game_id: GameId, save_id: number): void {
    // DELETE all saves except initial and last one
    this.client.query('DELETE FROM games WHERE game_id = $1 AND save_id < $2 AND save_id > 0', [game_id, save_id], (err) => {
      if (err) {
        console.error('PostgreSQL:cleanSaves', err);
        throw err;
      }
      // Flag game as finished
      this.client.query('UPDATE games SET status = \'finished\' WHERE game_id = $1', [game_id], (err2) => {
        if (err2) {
          console.error('PostgreSQL:cleanSaves2', err2);
          throw err2;
        }
      });
    });
    this.purgeUnfinishedGames();
  }

  // Purge unfinished games older than MAX_GAME_DAYS days. If this environment variable is absent, it uses the default of 10 days.
  purgeUnfinishedGames(): void {
    const envDays = parseInt(process.env.MAX_GAME_DAYS || '');
    const days = Number.isInteger(envDays) ? envDays : 10;
    this.client.query('DELETE FROM games WHERE created_time < now() - interval \'1 day\' * $1', [days], function(err?: Error, res?: QueryResult<any>) {
      if (res) {
        console.log(`Purged ${res.rowCount} rows`);
      }
      if (err) {
        return console.warn(err.message);
      }
    });
  }

  cleanGame(game_id: string): void {
    // DELETE all saves
    this.client.query('DELETE FROM games WHERE game_id = ? ', [game_id], function(err: { message: any; }) {
      if (err) {
        return console.warn(err.message);
      }
    });
  }

  cleanGameSave(game_id: string, save_id: number): void {
    // DELETE one  save  by save id
    this.client.query('DELETE FROM games WHERE game_id = ? AND save_id = ?', [game_id, save_id], function(err: { message: any; }) {
      if (err) {
        return console.warn(err.message);
      }
    });
  }

  restoreGame(game_id: string, save_id: number, game: Game, _playId: string): void {
    // Retrieve last save from database
    this.client.query('SELECT game game FROM games WHERE game_id = $1 AND save_id = $2 ORDER BY save_id DESC LIMIT 1', [game_id, save_id], (err, res) => {
      if (err) {
        return console.error('PostgreSQL:restoreGame', err);
      }
      if (res.rows.length === 0) {
        console.error('PostgreSQL:restoreGame', 'Game not found');
        return;
      }

      // Transform string to json
      const gameToRestore = JSON.parse(res.rows[0].game);

      // Rebuild each objects
      game.loadFromJSON(gameToRestore);
    });
  }

  saveGameState(game_id: string, save_id: number, game: string): void {
    // Insert
    this.client.query('INSERT INTO games(game_id, save_id, game) VALUES($1, $2, $3)', [game_id, save_id, game], (err) => {
      if (err) {
        // Should be a duplicate, does not matter
        return;
      }
    });
  }

  deleteGameNbrSaves(game_id: GameId, rollbackCount: number): void {
    if (rollbackCount > 0) {
      this.client.query('DELETE FROM games WHERE ctid IN (SELECT ctid FROM games WHERE game_id = $1 ORDER BY save_id DESC LIMIT $2)', [game_id, rollbackCount], (err) => {
        if (err) {
          return console.warn(err.message);
        }
      });
    }
  }
  saveUser(_id: string, _name: string, _password: string, _prop: string): void {
    throw new Error('Method not implemented.');
  }
  getUsers(_cb: (err: any, allUsers: import('../User').User[]) => void): void {
    throw new Error('Method not implemented.');
  }
  refresh(): void {
    throw new Error('Method not implemented.');
  }
}
