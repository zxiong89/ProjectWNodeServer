import { IGameData } from "../data/IGameData";
import { TileDataSelection } from "../data/tiles/TileDataSelection";
import { IGameAction } from "./IGameAction";
import { GameSubmitWordParams } from "./params/GameSubmitWordParams";
import { BoardData } from "../data/BoardData";
import { BoardChangeTypesEnum } from "../data/BoardChangeTypesEnum";
import { TileData } from "../data/tiles/TileData";
import { SessionData } from "../data/SessionData";
import { TileBag } from "../../board/TileBag";
import { BoardCache } from "../../board/BoardCache";
import { WordDictionary } from "../../dictionary/wordDictionary";
import { PlayerData } from "../data/PlayerData";
import { CharacterType } from "../data/playerData/CharacterType";
import { String } from "aws-sdk/clients/cloudsearch";

export class GameActionSubmitWord implements IGameAction {
    static readonly MESSAGE_NAME = "SubmitWord";
    readonly Name = GameActionSubmitWord.MESSAGE_NAME;
    Params: GameSubmitWordParams = {};
    
    async parse(data: IGameData[], cache: BoardCache): Promise<string | undefined> {
        const gameId = this.Params.GameId as String;
        const playerId = this.Params.UserId as string;
        const word = this.Params.Word;
        const selection = this.Params.Selection;

        if (!word) return `Word is null`;
        if (!selection) return `Selection is null`;
        if (!matchesWord(selection, word)) return `Selection doesn't match word`;

        if (!cache.GameId) cache.GameId = this.Params.GameId;

        if (!cache.dictionary) cache.dictionary = new WordDictionary();
        if (!cache.dictionary.words.get(word)) return `Word is not valid`;

        const isCacheUpdated = await cache.getGameState();
        if (!isCacheUpdated) return `Unable to fetch gameState for ${cache.GameId}`;
        
        const points = this.Params.Selection ? scoreSelection(this.Params.Selection) : 0;
        
        if (points <= 0) {
            const sessionUpdate = new SessionData({
                Score: -1
            });
            data.push(sessionUpdate);
        
            return undefined;
        }

        const tileBag = cache.TileBag as TileBag;

        const removal = new BoardData({
            TileDelta: selection,
            ChangeType: BoardChangeTypesEnum.Remove
        });
        data.push(removal);
        for (const s of selection) {
            TileBag.ReturnTileData(tileBag, s.TileData);
        }

        const newTiles = cache.removeAndAddTiles(selection);
        const addition = new BoardData({
            TileDelta: newTiles,
            ChangeType: BoardChangeTypesEnum.Add
        });
        data.push(addition);

        const sessionData = await cache.getSessionData(cache.DB, playerId, gameId);
        const damageDealt = sessionData?.addTurn(playerId, points);

        const enemyId: string = sessionData.GetOpponentId(playerId);
        const playerData = await PlayerData.GetPlayerData(cache.DB, playerId, CharacterType.Player, gameId);
        const enemyData = await PlayerData.GetPlayerData(cache.DB, enemyId, CharacterType.Enemy, gameId);
        playerData.AddMana(points);

        let isAlive = true;
        if (damageDealt < 0) isAlive = playerData.TakeDamage(damageDealt * -1);
        else if (damageDealt > 0) isAlive = enemyData.TakeDamage(damageDealt);

        data.push(enemyData);
        data.push(playerData);
        
        await sessionData?.UpdateChecksum(cache, playerData, enemyData);

        await cache.requestSaveToDB().promise();
        await sessionData.SaveSessionDataToDB(cache.DB, playerId).promise();
        await playerData.SavePlayerDataForGame(cache.DB, gameId).promise();
        await enemyData.SavePlayerDataForGame(cache.DB, gameId).promise();

        const sessionUpdate = new SessionData({
            TurnCount: sessionData?.TurnCount,
            Score: sessionData?.Score,
            TotalDamage: sessionData?.TotalDamage,
            IsMyTurn: sessionData?.IsMyTurn,
            IsActive: !isAlive
        });
        data.push(sessionUpdate);

        return undefined;
    }

    constructor(init?: Partial<GameActionSubmitWord>) {
        Object.assign(this, init);
    }
}

function matchesWord(selection: TileDataSelection[], word: string): boolean {
    if (!selection || !word || selection.length != word.length) return false;
    return selection.map((s) => s.TileData.Letter).join(``) == word;
}

function scoreSelection(selection: TileDataSelection[]): number {
    let score = 0;
    selection.forEach((s) => score+= s.TileData.Score);
    return score;
}