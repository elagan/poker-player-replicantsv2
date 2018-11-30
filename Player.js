const request = require('sync-request');
const MIN_BET = 20;

class Player {
  static get VERSION() {
    return '0.1';
  }

  static getRank(gameState) {
    let cards = gameState.community_cards.concat(gameState.players[gameState.in_action].hole_cards);
    if (cards.length < 7) {
      let suits = {"diamonds": 0, "hearts": 1, "clubs": 2, "spades": 3};
      let suitCount = [0, 0, 0, 0];
      cards.forEach(card => {
        suitCount[suits[card.suit]] += 1;
      });
      if (Math.max(suitCount) >= 4) {
        return 19;
      }
    }
    try {
      let res = request('GET', 'http://rainman.leanpoker.org/rank?cards=' + JSON.stringify(cards));
      let a = JSON.parse(res.getBody('utf-8'));
      return a.rank * 10;
    } catch (e) {
      console.error(e);
    }
    return 0;
  }

  static rateCards(gameState) {
    if (gameState.community_cards.length < 6) {
      let player = gameState.players[gameState.in_action];
      let cards = player.hole_cards;
      if (this.toValue(cards[0]) > 10 || this.toValue(cards[1]) > 10) {
        return 10;
      } else if (this.toValue(cards[0]) === this.toValue(cards[1])) {
        return 10;
      } else if (cards[0].suit === cards[1].suit) {
        return 10;
      }
    }
    else {
      return this.getRank(gameState);
    }
    return 0;
  }

  static toValue(card) {
    if (card.rank === "J") {
      return 11;
    }
    else if (card.rank === "Q") {
      return 12;
    }
    else if (card.rank === "K") {
      return 13;
    }
    else if (card.rank === "A") {
      return 14;
    }
    return 0 + card.rank;
  }

  static betRequest(gameState, bet) {
    let player = gameState.players[gameState.in_action];
    let score = this.rateCards(gameState);
    let multiplier = player.stack >= 2000 ? 2 : 1;
    if (player.stack > 3000 || player.stack <= 100) {
      bet(player.stack);
    }
    else if (score >= 70) {
      bet(player.stack);
    }
    else if (score >= 30) {
      bet(this.raiseOrMaxStack(gameState.minimum_raise + score * MIN_BET * 8 * multiplier, player));
    }
    else if (score >= 20) {
      bet(this.raiseOrMaxStack(gameState.minimum_raise + MIN_BET * 4 * multiplier, player));
    }
    else if (score >= 10 && gameState.current_buy_in <= 150) {
      bet(this.raiseOrMaxStack(MIN_BET, player));
    }
    else {
      bet(0);
    }
  }

  static raiseOrMaxStack(bet, player) {
    if (player.stack > bet) {
      return bet;
    }
    return player.stack;
  }

  static showdown(gameState) {
    console.log(gameState);
  }
}

module.exports = Player;
