//https://cwe.mitre.org/data/definitions/806.html

import {getPotentialMitigations} from "./findIssue.js";
import {findFunctions} from "./cwe_676.js";
import isComment from "./isComment.js";

let issueNumber = 806

const cwe_806 = (data, comment) => {

    let errorsFound = findErrors(data, comment, findFunctions(data, ['strncpy']))
    let errors = {
        //TODO: fixme
        "mitigation": getPotentialMitigations(issueNumber),
        "text": `In the following lines the buffer size is calculated with the buffer source size: ${errorsFound.map(single => `in line ${single}`).join(', ')}`,
        "lineNumbers": errorsFound,
        "issueNumber": issueNumber
    }

    return errors
}

const findErrors = (data, comment, possibleErrors) => {
    let result = []
    for(let i = 0 ; i < possibleErrors.length; ++i){
        if(!isComment(possibleErrors[i].lineNumber, comment.comments.lineComments, comment.comments.blockComments)){
            let split = functionArguments(data[possibleErrors[i].lineNumber - 1], 'strncpy')
            let start = 0
            let end = 0
            let count = 0
            for(let j = 0 ; j < split.length; ++j){
                if(split[j] === '(' && count === 0){ count++; start = j + 1}
                else if(split[j] === '(' && count > 0){ count++;}
                else if(split[j] === ')' && count > 1){ count--;}
                else if(split[j] === ')' && count === 1){ end = j; break;}
            }
            let dest = split.slice(start, end).join('').split(',')[0]
            //let source = split.slice(start, end).join('').split(',')[1]
            let size = split.slice(start, end).join('').split(',')[2]
            let regex = new RegExp(`sizeof\\(${dest}\\)`)
            let match = size.match(regex)
            if(match === null){
                result.push(possibleErrors[i].lineNumber)
            }
        }
    }
    return result
}

export const functionArguments = (line, functionName) => {
    line = line.replace(/\s/g, '')
    let match = line.match(functionName)
    let split = line.split('').slice(match.index + functionName.length, line.length)
    return split
}

export default cwe_806