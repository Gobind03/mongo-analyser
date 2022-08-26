import { BaseObject } from "../models/LogLine.model";
import qs from "qs";


export const sort_by_key = (array: Array<any>, key: string) => {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
};

export const redact_v2 = (filter: BaseObject | string) => {
    if (!filter)
        return JSON.stringify({});
    const topLevelTokens = qs.stringify(filter).split("&");
    return JSON.stringify(qs.parse(topLevelTokens.map((tk: string) => {
        const [pre, val] = tk.split("=");
        return [pre, "1"].join("=")
    }).join("&")))
};


// TODO : merge get_potential_index and get_potential_index_aggregate
export function get_potential_index(logLine:any,parsedLogLine:any,opType:string){
    let queryFilter = logLine.attr.command.filter;
    let equalityKeys = []
    let rangeKeys = []
    let sortKeys = []
    let sortCheck = logLine.attr.command.sort 
    let sortData:any = "";
    if (sortCheck !== null){
        sortData = JSON.stringify(sortCheck);
        for (var s in sortCheck) {
            sortKeys.push(s)
        }
    }
    for (var q in queryFilter) {
        
        if(typeof queryFilter[q] === 'object') {

            if (queryFilter[q].hasOwnProperty('$gte') || queryFilter[q].hasOwnProperty('$lte') || 
            queryFilter[q].hasOwnProperty('$lt') || queryFilter[q].hasOwnProperty('$gt') || 
            queryFilter[q].hasOwnProperty('$nin')|| queryFilter[q].hasOwnProperty('$ne')){
                
                rangeKeys.push(q)
            
            }else if(queryFilter[q].hasOwnProperty('$in') ) {
                
                if (queryFilter[q]["$in"]?.length > 200 || queryFilter[q]["$nin"]?.length > 200 ){
                    rangeKeys.push(q)
                }else{
                    equalityKeys.push(q)
                }
                
            }       
        }else{
            equalityKeys.unshift(q)
        }
    }

    var pindex = equalityKeys.concat(sortKeys).concat(rangeKeys);                                   
    var dbdata = {"namespace" : logLine.attr.ns ,"operation_type" : opType,"query": JSON.stringify(parsedLogLine.QueryHash), "potential_index": JSON.stringify(pindex) };
    return dbdata

}

export function get_potential_index_aggregate(logLine:any,opType:string){
    let queryFilters : any = logLine.attr.command.pipeline; 
    let equalityKeys = []
    let rangeKeys = []
    let sortKeys = []
    
    let stages: any = [];
    for(let i=0; i<queryFilters.length; i++){                                            

        if (queryFilters[i].hasOwnProperty('$match') && !stages.includes("other")){
            let match = queryFilters[i]["$match"]
            for (var q in queryFilters[i]["$match"]) {
        
                //console.log(typeof q)
                if(typeof match[q] === 'object') {

                    if (match[q].hasOwnProperty('$gte') || match[q].hasOwnProperty('$lte') || 
                    match[q].hasOwnProperty('$lt') || match[q].hasOwnProperty('$gt') || 
                    match[q].hasOwnProperty('$nin')|| match[q].hasOwnProperty('$ne')){
                        
                        rangeKeys.push(q)
                    
                    }else if(match[q].hasOwnProperty('$in') ) {
                        
                        if (match[q]["$in"]?.length > 200 || match[q]["$nin"]?.length > 200 ){
                            
                            rangeKeys.push(q)

                        }else{
                            equalityKeys.push(q)
                        }
                    } 
                }else{
                    equalityKeys.unshift(q)
                }
            }

            stages.push("match") 
        }else if (queryFilters[i].hasOwnProperty('$sort') && stages.includes("match")){
            stages.push("sort");
            let sortCheck = queryFilters[i]["$sort"]
            if (sortCheck !== null){
                for (var s in sortCheck) {
                    sortKeys.push(s)
                }
            }
        }else {
            stages.push("other");

        }
    }

    var pindex = equalityKeys.concat(sortKeys).concat(rangeKeys);
    var dbdata = {"namespace" : logLine.attr.ns ,"operation_type" : opType,"query": JSON.stringify(logLine.attr.command.pipeline), "potential_index": JSON.stringify(pindex) };
    return dbdata
}