export class TabCompleteRequest {
    transactionId: number;
    text: string;
}

export class TabCompleteResponseMatch {
    match: string;
    tooltip?: string | never;
}

export class TabCompleteResponse {
    transactionId: number;
    start: number;
    length: number;
    matches: TabCompleteResponseMatch[];
}