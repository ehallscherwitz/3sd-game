import Phaser from 'phaser';
import { createGame } from '../game/createGame.js';
import { tick } from '../game/loop.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    this.ctx = createGame(this);
    this.ctx.mount();
  }

  update(time, delta) {
    tick(this.ctx, time, delta);
  }
}
