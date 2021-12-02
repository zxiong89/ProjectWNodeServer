import { GameActionCreate, GameActionCreate as requestHandler } from "./messages/actions/GameActionCreate";
import { GameActionSubmitWord } from "./messages/actions/GameActionSubmitWord";
import { IGameAction } from "./messages/actions/IGameAction";
import { IGameData } from "./messages/data/IGameData";
import { GameRequest } from "./messages/GameRequest";
import { GameResponse } from "./messages/GameResponse";
import { BoardCache } from "./board/BoardCache";

import { DynamoDB } from 'aws-sdk';
import { GameActionGetState } from "./messages/actions/GameActionGetState";
import { GameActionGetSessions } from "./messages/actions/GameActionGetSessions";

export default async function parse(request: GameRequest): Promise<string> {
    let data: IGameData[] = [];

    let client = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? 
        new DynamoDB.DocumentClient({ 
            region: "us-east-2",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        })
        :
        new DynamoDB.DocumentClient({ 
            region: "us-east-2"
        });
     let err: string[] = [];
     
    let cache: BoardCache = new BoardCache(client);
    for(const action of request.Actions) {
        const error = await parseAction(data, action, cache);
        if (error) err.push(error);
    }
    const result = await cache.requestSaveToDB().promise();

    if (result.$response.error) {
        err.push(JSON.stringify(result.$response.error));
    }

    let response: GameResponse = {
        IsSuccess: true,
        Data: data
    }

    if (err.length > 0) {
        response.IsSuccess = false;
        response.Errors = err;
    }

    const returnString = JSON.stringify(response);

    return returnString;
}

async function parseAction(data: IGameData[], action: IGameAction, board: BoardCache): Promise<string | undefined> {
    let error: string | undefined;

    switch (action.Name) {
        case requestHandler.MESSAGE_NAME: {
            let create = new GameActionCreate(action as requestHandler);
            error = await create.parse(data, board);
            break;
        }

        case GameActionGetState.MESSAGE_NAME: {
            let submit = new GameActionGetState(action as GameActionGetState);
            error = await submit.parse(data, board);
            break;
        }

        case GameActionSubmitWord.MESSAGE_NAME: {
            let submit = new GameActionSubmitWord(action as GameActionSubmitWord);
            error = await submit.parse(data, board);
            break;
        }

        case GameActionGetSessions.MESSAGE_NAME: {
            let submit = new GameActionGetSessions(action as GameActionGetSessions);
            error = await submit.parse(data, board);
            break;
        }
    }

    return error;
}