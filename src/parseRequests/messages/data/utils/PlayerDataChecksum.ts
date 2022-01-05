import { PlayerData } from "../PlayerData";

/**
 * Reflection of CharacterDataSave for local saves
 * Meant to serialize only the neccessary data
 */
export class PlayerDataChecksum {
    Id?: string;
    Health?: number;
    MaxHealth?: number;
    Mana?: number;

    constructor(init?: Partial<PlayerDataChecksum>) {
        Object.assign(this, init);
    }

    public static CreatePlayerDataChecksum(data: PlayerData) {
        return new PlayerDataChecksum({
            Id: data.Id,
            Health: data.Health,
            MaxHealth: data.MaxHealth,
            Mana: data.Mana
        });
    }
}