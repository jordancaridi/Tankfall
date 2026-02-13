import * as weaponsJson from '../../content/weapons.json';

export interface WeaponDefinition {
  id: string;
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  projectileLifetime: number;
  projectileRadius: number;
  muzzleOffset: number;
}

interface WeaponsContentFile {
  items: WeaponDefinition[];
}

const rawWeapons = weaponsJson as WeaponsContentFile & { default?: WeaponsContentFile };
const content: WeaponsContentFile = rawWeapons.default ?? rawWeapons;

const weaponMap = new Map<string, WeaponDefinition>();
content.items.forEach((weapon) => {
  weaponMap.set(weapon.id, weapon);
});

export const getWeaponDefinition = (weaponId: string): WeaponDefinition => {
  const definition = weaponMap.get(weaponId);
  if (!definition) {
    throw new Error(`Unknown weapon id: ${weaponId}`);
  }

  return definition;
};
