import { ILetterSet } from "./base/ILetterSet";
import { Letter } from "./base/Letter";

export class DefaultLetterSet implements ILetterSet {
    static readonly myLetters: Letter[] = [
        {Letter: `A`, Score: 1, Frequency: 27},
        {Letter: `B`, Score: 2, Frequency: 6},
        {Letter: `C`, Score: 2, Frequency: 6},
        {Letter: `D`, Score: 2, Frequency: 12},
        {Letter: `E`, Score: 1, Frequency: 36},
        {Letter: `F`, Score: 2, Frequency: 6},
        {Letter: `G`, Score: 2, Frequency: 9},
        {Letter: `H`, Score: 3, Frequency: 6},
        {Letter: `I`, Score: 1, Frequency: 27},
        {Letter: `J`, Score: 4, Frequency: 3},
        {Letter: `K`, Score: 3, Frequency: 3},
        {Letter: `L`, Score: 1, Frequency: 12},
        {Letter: `M`, Score: 2, Frequency: 6},
        {Letter: `N`, Score: 1, Frequency: 18},
        {Letter: `O`, Score: 1, Frequency: 24},
        {Letter: `P`, Score: 2, Frequency: 6},
        {Letter: `Q`, Score: 4, Frequency: 3},
        {Letter: `R`, Score: 1, Frequency: 18},
        {Letter: `S`, Score: 1, Frequency: 12},
        {Letter: `T`, Score: 1, Frequency: 18},
        {Letter: `U`, Score: 1, Frequency: 12},
        {Letter: `V`, Score: 3, Frequency: 6},
        {Letter: `W`, Score: 3, Frequency: 6},
        {Letter: `X`, Score: 4, Frequency: 3},
        {Letter: `Y`, Score: 3, Frequency: 6},
        {Letter: `Z`, Score: 4, Frequency: 3}
    ];
    Letters: Letter[] = DefaultLetterSet.myLetters;
}