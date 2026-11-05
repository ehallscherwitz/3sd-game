import Phaser from 'phaser';
import { gameConfig } from './game/config.js';

// Composition root. Systems are wired in createGame, then driven by loop.tick.
new Phaser.Game(gameConfig);
