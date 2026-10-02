//https://cwe.mitre.org/data/definitions/781.html

import {getPotentialMitigations} from "./findIssue.js";
import {findFunctions} from "./cwe_676.js";
import isComment from "./isComment.js";

let issueNumber = 781

const cwe_781 = (data, comment) => {

    let potentialErrosFound = findFunctions(data, ['ioctl'])

    let errorsFound =  findErrors(data, comment, potentialErrosFound)

    errorsFound = errorsFound.filter(single => !isComment(single.start, comment.comments.lineComments, comment.comments.blockComments))

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": `In the following line the command ioctl could be male used, this vulnerability causes only problems in the WIN32 environment: ${errorsFound.map(single => `from line ${single.start} to line ${single.end}`).join(", ")}`,
        "lineNumbers": errorsFound.map(single => single.lineNumber),
        "issueNumber": issueNumber
    }

    return errors
}

const findErrors = (data, comment, pEF) => {
    let result = [] // {start: number, end: number}

    for(let i = 0 ; i < pEF.length; ++i){
        let startLine = pEF[i].lineNumber - 1
        let endLine = pEF[i+1] !== undefined ? pEF[i+1].lineNumber : data.length - 1
        let lines = data.splice(startLine, endLine).join('')
        let regex = new RegExp(`ioctl\\(`)
        let match = lines.match(regex)
        let linesSplit = lines.split('')
        let count = 0
        let start = 0
        let end = 0
        if(match) {
            for (let j = match.index + 5; j < linesSplit.length; j++) {
                if (count === 0 && linesSplit[j] === '(') {
                    count++;
                    start = j
                } else if (count > 0 && linesSplit[j] === '(') {
                    count++;
                } else if (count > 1 && linesSplit[j] === ')') {
                    count--;
                } else if (count === 1 && linesSplit[j] === ')') {
                    count--;
                    end = j
                }
            }
        }
        lines = linesSplit.splice(start, end).join('')
        regex = new RegExp(`METHOD_NEITHER`)
        match = lines.match(regex)
        if(match){
            result.push({start: startLine, end: endLine})
        }
    }

    return result
}

export default cwe_781