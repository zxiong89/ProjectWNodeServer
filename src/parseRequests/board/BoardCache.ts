import { AWSError, DynamoDB, Request } from "aws-sdk";
import { WordDictionary } from "../dictionary/wordDictionary";
import { TileData } from "../messages/data/tiles/TileData";
import { TileBag } from "./TileBag";

const gamesTable = `projectWGames`;

export class BoardCache {
    client: DynamoDB.DocumentClient;
    gameId?: string;
    tiles?: TileData[][];
    tileBag?: TileBag;
    dictionary?: WordDictionary;

    constructor(client: DynamoDB.DocumentClient) {
        this.client = client;
    }

    requestSaveToDB(): Request<DynamoDB.DocumentClient.PutItemOutput, AWSError> {
        let params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: gamesTable,
            Item: {
                "gameId": this.gameId
            }
        }

        if (this.tiles) params.Item["tiles"] = JSON.stringify(this.tiles);
        
        if (this.tileBag) params.Item["tileBag"] = JSON.stringify(this.tileBag);

        return this.client.put(params);
    }

    async getGameState(): Promise<boolean> {
        if (!this.gameId) return false;
        if (this.tiles && this.tileBag) return true;

        let response = await this.client.get({
            TableName: gamesTable,
            Key: {
                "gameId": this.gameId
            }
        }).promise();

        if (!response.Item) return false;

        if (response.Item["tiles"]) this.tiles = await JSON.parse(response.Item["tiles"]);
        if (response.Item["tileBag"]) this.tileBag = await JSON.parse(response.Item["tileBag"]);
        
        return true;
    }
}