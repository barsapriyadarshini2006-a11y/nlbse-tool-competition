//https://cwe.mitre.org/data/definitions/415.html

import {getPotentialMitigations} from "./findIssue.js";
import {findFunctions} from "./cwe_676.js";
import isComment from "./isComment.js";
import findCodeBlocks from './findCodeBlock.js'

let issueNumber = 415

const cwe_415 = (data, comments) => {
    let potentialErrors = findFunctions(data, ['free'])
    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": '',
        "lineNumbers": [],
        "additionalInformation": [],
        "issueNumber": issueNumber
    }

    // we just found an extreme high amount of false positives if goto is involved
    if(data.join("\n").includes("goto")){
        return errors
    }

    //checks if a line where free is in use is a comment.
    //and simplifies the structure, the indicator gets lost but as it is only free it does not matter
    potentialErrors = potentialErrors
        .filter(single => !isComment(single.lineNumber, comments.comments.lineComments, comments.comments.blockComments))
        .map(single => {return {lineNumber:single.lineNumber - 1, indicator: single.functionName}})

    for(let i=0;i<potentialErrors.length;++i){
        potentialErrors[i] = {
            ...potentialErrors[i],
            "start": potentialErrors[i].lineNumber,
            "end": data.length,
            "varName": getVarName(data, potentialErrors[i].lineNumber)
        }
    }

    for (let i = 0; i < potentialErrors.length; ++i) {
        for (let j = 0; j < potentialErrors.length; ++j) {
            if (j !== i) {
                if (
                    potentialErrors[i].varName === potentialErrors[j].varName
                    &&
                    potentialErrors[j].lineNumber >= potentialErrors[i].start
                    &&
                    potentialErrors[j].lineNumber <= potentialErrors[i].end
                ) {
                    errors.lineNumbers.push(potentialErrors[j].lineNumber+1)
                    errors.additionalInformation.push({
                        free: potentialErrors[i].lineNumber+1,
                        freeSecond: potentialErrors[j].lineNumber+1
                    })
                    potentialErrors.splice(i, 1)
                    potentialErrors.splice(j - 1, 1)
                }
            }
        }
    }

    errors.text = `In the following lines an error occurred: ${errors.lineNumbers.map(single => `free in line ${single.free} and in line ${single.freeSecond} the variable was freed again`).join()}`

    return errors
}

export const getVarName = (data, lineNumber, functionName = "free") => {
    const regex = new RegExp(`(\\s|^|;)${functionName}\\s*`)
    let code = data[lineNumber].split(regex)
    code = code.slice(1, code.length).join("").split("")
    let counter = 0
    let start = false
    let varName = []
    let skipped = 0
    for(let index = 0;index < code.length;++index){
        if(code[index] === ")"){
            counter--
            if(counter===0) start = false
        }
        if(start === true){
            varName.push(code[index])
        }
        if(code[index] === "("){
            counter++
            start = true
        }
        if(counter === 0 && varName.length !== 0){
            return varName
                .join("")
                .replaceAll("*", "\\*")
        }
        if(index === code.length-1){
            skipped++
            index = 0
            code = data[lineNumber+skipped]
        }
    }
}

export default cwe_415