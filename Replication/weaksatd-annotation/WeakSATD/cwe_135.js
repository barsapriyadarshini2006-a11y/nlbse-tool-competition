//https://cwe.mitre.org/data/definitions/135.html

import {getPotentialMitigations} from "./findIssue.js";
import {findFunctions} from "./cwe_676.js";
import isComment from "./isComment.js";

let issueNumber = 135

const cwe_135 = (data, comments) => {

    let errorsFound = findFunctions(data, ['malloc'])
        .filter(single => !isComment(single.lineNumber, comments.comments.lineComments, comments.comments.blockComments))
        .map(single => checkForSizeof(data, single))
        .filter(single => single !== false)

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": `In the following line the command strlen or wcslen was used: ${errorsFound.map(single => `in line ${single.lineNumber}`).join(", ")}`,
        "lineNumbers": errorsFound.map(single => single.lineNumber),
        "issueNumber": issueNumber
    }

    return errors
}

const checkForSizeof = (data, single) => {
    if(single.functionName !== "malloc"){
        return single
    }
    let line = data[single.lineNumber-1].split("malloc").slice(1).join("malloc")
    const result = []
    let start = false
    let count = 0
    for(let index = single.lineNumber-1;index<data.length-2;index++){
        line = line.split("")
        for(let i in line){
            const char = line[i]
            result.push(char)
            if(char === "("){
                start=true
                count++
            } if(char===")") {
                count--
            }
            if(count === 0 && start === true){
                if(result.join("").split("sizeof").length === 1){
                    return single
                }
            }
        }

        line = data[index+1]
    }

    return false
}

export default cwe_135