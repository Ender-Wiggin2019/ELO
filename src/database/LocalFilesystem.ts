import {IDatabase, DbLoadCallback} from './IDatabase';
import {Game, GameId, GameOptions, Score} from '../Game';
import {IGameData} from './IDatabase';
import {SerializedGame} from '../SerializedGame';
import {Dirent} from 'fs';

const path = require('path');
const fs = require('fs');
const dbFolder = path.resolve(__dirname, '../../../db/files');
const historyFolder = path.resolve(dbFolder, 'history');

export class Localfilesystem implements IDatabase {
  constructor() {
    console.log(`Starting local database at ${dbFolder}`);
    if (!fs.existsSync(dbFolder)) {
      fs.mkdirSync(dbFolder);
    }
    if (!fs.existsSync(historyFolder)) {
      fs.mkdirSync(historyFolder);
    }
  }

  _filename(gameId: string): string {
    return path.resolve(dbFolder, `game-${gameId}.json`);
  }

  _historyFilename(gameId: string, saveId: number) {
    const saveIdString = saveId.toString().padStart(5, '0');
    return path.resolve(historyFolder, `game-${gameId}-${saveIdString}.json`);
  }
  saveSerializedGame(serializedGame: SerializedGame): void {
    const text = JSON.stringify(serializedGame, null, 2);
    fs.writeFileSync(this._filename(serializedGame.id), text);
    fs.writeFileSync(this._historyFilename(serializedGame.id, serializedGame.lastSaveId), text);
  }

  getGame(game_id: GameId, cb: (err: Error | undefined, game?: SerializedGame) => void): void {
    try {
      console.log(`Loading ${game_id}`);
      const text = fs.readFileSync(this._filename(game_id));
      const serializedGame = JSON.parse(text);
      cb(undefined, serializedGame);
    } catch (err) {
      cb(err, undefined);
    }
  }

  getGameVersion(_game_id: GameId, _save_id: number, _cb: DbLoadCallback<SerializedGame>): void {
    throw new Error('Not implemented');
  }

  getClonableGames(cb: (err: Error | undefined, allGames: Array<IGameData>) => void) {
    this.getGames((err, gameIds) => {
      const filtered = gameIds.filter((gameId) => fs.existsSync(this._historyFilename(gameId, 0)));
      const gameData = filtered.map((gameId) => {
        const text = fs.readFileSync(this._historyFilename(gameId, 0));
        const serializedGame = JSON.parse(text) as SerializedGame;
        return {gameId: gameId, playerCount: serializedGame.players.length};
      });
      cb(err, gameData);
    });
  }

  getGames(cb: (err: Error | undefined, allGames: Array<GameId>) => void) {
    const gameIds: Array<GameId> = [];

    // TODO(kberg): use readdir since this is expected to be async anyway.
    fs.readdirSync(dbFolder, {withFileTypes: true}).forEach((dirent: Dirent) => {
      if (!dirent.isFile()) {
        return;
      }
      const re = /game-(.*).json/;
      const result = dirent.name.match(re);
      if (result === null) {
        return;
      }
      gameIds.push(result[1]);
    });
    cb(undefined, gameIds);
  }

  restoreReferenceGame(_game_id: GameId, _game: Game, cb:(err: any) => void): void{
    cb(undefined);
  }

  saveGameResults(_game_id: GameId, _players: number, _generations: number, _gameOptions: GameOptions, _scores: Array<Score>): void {
    // Not implemented
  }

  cleanSaves(_game_id: GameId, _save_id: number): void {
    // Not implemented here.
  }

  purgeUnfinishedGames(): void {
    // Not implemented.
  }

  restoreGame(_game_id: GameId, _save_id: number, _game: Game, _playId: string): void{
    throw new Error('Undo not yet implemented');
  }

  deleteGameNbrSaves(_game_id: GameId, _rollbackCount: number): void {
    throw new Error('Rollback not yet implemented');
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
  saveGameState(_game_id: GameId, _save_id: number, _game: string): void{
    throw new Error('Method not implemented.');
  }
  cleanGame(_game_id: string): void{
    throw new Error('Method not implemented.');
  }
  cleanGameSave(_game_id: string, _save_id: number): void{
    throw new Error('Method not implemented.');
  }
}
