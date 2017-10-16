import { EntityPhysics } from './entity-physics';

export abstract class EntityLiving extends EntityPhysics {
  maxHealth = 100;
  health = 100;
  immortal = false;
  constructor(name, game) {
    super(name, game);
    this.expirable = false;
  }

  damage(d: number) {
    this.health -= d;
    if (this.health <= 0)
      this.onDeath();
  }

  heal(d=Infinity) {
    this.health = Math.min(this.health + d, this.maxHealth);
  }

  abstract onDeath();
}
