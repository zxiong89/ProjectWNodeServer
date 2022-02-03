import { AWSError, DynamoDB, Request } from "aws-sdk";
import { WordDictionary } from "../dictionary/wordDictionary";
import { SessionData } from "../messages/data/SessionData";
import { TileData } from "../messages/data/tiles/TileData";
import { TileDataSelection } from "../messages/data/tiles/TileDataSelection";
import { TileBag } from "./TileBag";

const dbTableName = `projectWGames`;
const dbColTiles = `tiles`;
const dbColTileBag = `tileBag`;

export class BoardCache {
    DB: DynamoDB.DocumentClient;
    GameId?: string;
    SessionData?: SessionData;
    Tiles?: TileData[][]; // access row, col
    TileBag?: TileBag;
    dictionary?: WordDictionary;

    constructor(client: DynamoDB.DocumentClient) {
        this.DB = client;
    }

    public removeAndAddTiles(rowCount: number, colCount: number, selection: TileDataSelection[]): TileDataSelection[] {
        if (this.TileBag == undefined) return [];
        const tileBag = this.TileBag as TileBag;

        const rowCounts: number[] = [];
        for (let c = 0; c < colCount; c++) rowCounts.push(rowCount);

        const newTiles: TileDataSelection[] = [];
        for (const s of selection) {
            newTiles.push({
                Row: s.Row,
                Col: s.Col,
                TileData: TileBag.GetRandomTileData(tileBag)
            });
        }

        const tiles = this.Tiles as TileData[][];
        for (const t of newTiles) {
            tiles[t.Row][t.Col] = t.TileData;
        }

        return newTiles;
    }

    public requestSaveToDB(): Request<DynamoDB.DocumentClient.PutItemOutput, AWSError> {
        if (!this.SessionData || !this.GameId) throw new Error(`Cannot create request to save without gameId`);

        let params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: dbTableName,
            Item: {
                "gameId": this.GameId
            }
        }

        this.addBoardCacheToParams(params);
        return this.DB.put(params);
    }

    private addBoardCacheToParams(params: DynamoDB.DocumentClient.PutItemInput): void {
        if (this.Tiles) params.Item[dbColTiles] = JSON.stringify(this.Tiles);
        if (this.TileBag) params.Item[dbColTileBag] = JSON.stringify(this.TileBag);
    }

    public async getGameState(): Promise<boolean> {
        if (!this.GameId) return false;
        if (this.Tiles && this.TileBag) return true;

        let params: DynamoDB.DocumentClient.GetItemInput = {
            TableName: dbTableName,
            Key: {
                "gameId": this.GameId
            }
        };

        let response = await this.DB.get(params).promise();
        if (!response.Item) return false;

        if (response.Item[dbColTiles]) this.Tiles = await JSON.parse(response.Item[dbColTiles] as string);
        if (response.Item[dbColTileBag]) this.TileBag = await JSON.parse(response.Item[dbColTileBag] as string);
        
        return true;
    }
    
    public async getSessionData(db: DynamoDB.DocumentClient, playerId: string, gameId?: string): Promise<SessionData> {
        if (this.SessionData != undefined) return this.SessionData;

        this.SessionData = await SessionData.GetGameSessionData(db, gameId != undefined ? gameId : this.GameId as string, playerId);

        return this.SessionData;
    }
}