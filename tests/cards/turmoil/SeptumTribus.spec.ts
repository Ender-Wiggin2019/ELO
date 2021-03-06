import {expect} from 'chai';
import {SeptemTribus} from '../../../src/cards/turmoil/SeptemTribus';
import {Game} from '../../../src/Game';
import {PartyName} from '../../../src/turmoil/parties/PartyName';
import {TestingUtils} from '../../TestingUtils';
import {TestPlayers} from '../../TestPlayers';

describe('SeptumTribus', function() {
  it('Should play', function() {
    const card = new SeptemTribus();
    const player = TestPlayers.BLUE.newPlayer();
    const player2 = TestPlayers.RED.newPlayer();

    const gameOptions = TestingUtils.setCustomGameOptions();
    const game = Game.newInstance('foobar', [player, player2], player, gameOptions);
    card.play();

    player.corpCard = card;
    player.megaCredits = 0;

    const turmoil = game.turmoil;
    expect(game.turmoil).is.not.undefined;

    if (turmoil) {
      turmoil.sendDelegateToParty(player, PartyName.REDS, game);
      turmoil.sendDelegateToParty(player, PartyName.REDS, game);
      card.action(player);
      expect(player.megaCredits).to.eq(2);

      player.megaCredits = 0;
      turmoil.sendDelegateToParty(player, PartyName.KELVINISTS, game);
      turmoil.sendDelegateToParty(player, PartyName.GREENS, game);
      card.action(player);
      expect(player.megaCredits).to.eq(6);
    }
  });

  it('Cannot act without Turmoil expansion', function() {
    const card = new SeptemTribus();
    const player = TestPlayers.BLUE.newPlayer();

    const gameOptions = TestingUtils.setCustomGameOptions({turmoilExtension: false});
    Game.newInstance('foobar', [player], player, gameOptions);
    card.play();

    player.corpCard = card;
    expect(card.canAct(player)).is.not.true;
  });
});
