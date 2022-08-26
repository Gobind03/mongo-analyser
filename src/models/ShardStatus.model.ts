import { Long } from "bson";

export interface BalancerStatus{
    mode?: string;
    inBalancerRound?: boolean;
    numBalancerRounds?: number;
}



export interface ServerList {
    map?: any;
    hosts?: any;
    connStrings?: any;
}

export interface ShardStatusModel {
    Balancer: BalancerStatus;
    ShardsList: ServerList;
}

