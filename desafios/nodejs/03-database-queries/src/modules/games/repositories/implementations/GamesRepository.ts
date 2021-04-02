import { getRepository, Repository, Like } from 'typeorm';

import { User } from '../../../users/entities/User';
import { Game } from '../../entities/Game';

import { IGamesRepository } from '../IGamesRepository';

export class GamesRepository implements IGamesRepository {
  private repository: Repository<Game>;

  constructor() {
    this.repository = getRepository(Game);
  }

  // Complete usando query builder
  async findByTitleContaining(param: string): Promise<Game[]> {
    return this.repository
      .createQueryBuilder("games")
      .where("LOWER(games.title) like LOWER(:name) " , {name: `%${param}%`})
      .getMany()
  }

  // Complete usando raw query
  async countAllGames(): Promise<[{ count: string }]> {
    return this.repository.query('select count(*) from games');
  }

  // Complete usando query builder
  async findUsersByGameId(id: string): Promise<User[]> {
    return this.repository
      .createQueryBuilder()
      .relation(Game,"users")
      .of(id)
      .loadMany()
  }
}