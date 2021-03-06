import {CardType} from './CardType';
import {Player} from '../Player';
import {IActionCard, ICard} from './ICard';
import {OrOptions} from '../inputs/OrOptions';
import {SelectAmount} from '../inputs/SelectAmount';
import {SelectHowToPay} from '../inputs/SelectHowToPay';
import {SelectOption} from '../inputs/SelectOption';
import {IProjectCard} from './IProjectCard';
import {SelectPlayer} from '../inputs/SelectPlayer';
import {AndOptions} from '../inputs/AndOptions';
import {SelectCard} from '../inputs/SelectCard';
import {SelectSpace} from '../inputs/SelectSpace';
import {CardMetadata} from './CardMetadata';
import {CardName} from '../CardName';
import {SelectHowToPayDeferred} from '../deferredActions/SelectHowToPayDeferred';
import {Card} from './Card';
import {MoonExpansion} from '../moon/MoonExpansion';
import {Units} from '../Units';

interface StaticStandardProjectCardProperties {
  name: CardName,
  cost: number,
  metadata: CardMetadata,
  reserveUnits?: Units,
}

export abstract class StandardProjectCard extends Card implements IActionCard, ICard {
  constructor(properties: StaticStandardProjectCardProperties) {
    super({
      cardType: CardType.STANDARD_PROJECT,
      ...properties,
    });
  }

  protected discount(player: Player): number {
    if (player.isCorporation(CardName.LABOUR_UNION)) return 4;
    return 0;
  }

  public play() {
    return undefined;
  }

  protected abstract actionEssence(player: Player): void

  public onStandardProject(player: Player): void {
    if (player.corpCard?.onStandardProject !== undefined) {
      player.corpCard.onStandardProject(player, this);
    }
    if (player.corpCard2?.onStandardProject !== undefined) {
      player.corpCard2.onStandardProject(player, this);
    }

    for (const playedCard of player.playedCards) {
      if (playedCard.onStandardProject !== undefined) {
        playedCard.onStandardProject(player, this);
      }
    }
  }

  public canAct(player: Player): boolean {
    return player.canAfford(this.cost - this.discount(player), {reserveUnits: MoonExpansion.adjustedReserveCosts(player, this)});
  }

  protected projectPlayed(player: Player) {
    player.game.log('${0} used ${1} standard project', (b) => b.player(player).card(this));
    this.onStandardProject(player);
  }

  public action(player: Player): OrOptions | SelectOption | AndOptions | SelectAmount | SelectCard<ICard> | SelectCard<IProjectCard> | SelectHowToPay | SelectPlayer | SelectSpace | undefined {
    player.game.defer(new SelectHowToPayDeferred(
      player,
      this.cost - this.discount(player),
      {
        title: `Select how to pay for ${this.name} project`,
        afterPay: () => {
          this.actionEssence(player);
        },
        canUseSteel: player.isCorporation(CardName._MINING_GUILD_) && this.name === CardName.CITY_STANDARD_PROJECT,
      }));
    this.projectPlayed(player);
    return undefined;
  }
}
