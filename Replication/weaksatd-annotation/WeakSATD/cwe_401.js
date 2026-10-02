//https://cwe.mitre.org/data/definitions/401.html
// eslint-disable-next-line
//import {get} from 'lodash'
// eslint-disable-next-line
//import {getPotentialMitigations} from "./findIssue";
import {findFunctions} from "./cwe_676.js";
import isComment from "./isComment.js";
import {getVarName} from "./cwe_415.js";

let issueNumber = 401

const cwe_401 = (data, comment) => {

    let errors = {
        "mitigation": 'not working',//getPotentialMitigations(issueNumber),
        "text": "",
        "lineNumbers": [],
        "issueNumber": issueNumber
    }

    let mallocUsed = findFunctions(data, ['malloc', 'realloc', 'calloc', 'wcsdup'])
    let errorsDetected = []


    for (let i = 0; i < mallocUsed.length; ++i) {
        mallocUsed[i].start = mallocUsed[i].lineNumber
        mallocUsed[i].end = data.length
        mallocUsed[i].varName = findPointer(data, mallocUsed[i].lineNumber-1)
    }

    let freeUsed = findFunctions(data, ['free'])
    for (let i = 0; i < freeUsed.length; ++i) {
        freeUsed[i].varName = getVarName(data, freeUsed[i].lineNumber-1)
    }

    for(let i = 0 ; i < mallocUsed.length ; ++i){
        let found = false
        for(let j = 0 ; j < freeUsed.length ; ++j){
            if(mallocUsed[i].varName === freeUsed[j].varName && mallocUsed[i].lineNumber < freeUsed[i].lineNumber){
                found = true
            }
        }
        if(!found){
            errorsDetected.push(mallocUsed[i])
        }
    }


    errors.lineNumbers = errorsDetected
        .map(single => single.lineNumber)
        .filter(single => !isComment(single, comment.comments.lineComments, comment.comments.blockComments))
    errors.text = `In the following line memory was allocated but never freed: ${mallocUsed.map(single => `in line ${single.lineNumber}`).join(', ')}`
    return errors
}
// eslint-disable-next-line
const findPointer = (data, lineNumber) => {
    let line = data[lineNumber]
    return line.split('=')[0].split('*')[1] && line.split('=')[0].split('*')[1].replaceAll(' ', '')
}

export default cwe_401