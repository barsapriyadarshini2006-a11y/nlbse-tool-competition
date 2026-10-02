//https://cwe.mitre.org/data/definitions/587.html

import {getPotentialMitigations} from "./findIssue.js";
import {findVariableDeclarations} from "./cwe_467.js";
import dataTypes from "./cwe_467_listOfDataTypes.js";
import isComment from "./isComment.js";


let issueNumber = 587

const cwe_587 = (data, comment) => {
    let errorsFound = findErrors(data, comment, findVariableDeclarations(data, dataTypes, {end: -1, start: -1}))
    let errorsFound_2 = findErrors_2(data)

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": `In the following line a fixed address was assignt to a point: ${errorsFound.map(single => `in line ${single}`).join(", ")}`,
        "lineNumbers": [errorsFound, errorsFound_2].flat(),
        "issueNumber": issueNumber
    }

    return errors
}

const findErrors = (data, comment, variables) => {
    let result = []
    for(let i = 0 ; i < variables.length; ++i){
        let line = data[variables[i].lineNumber - 1]
        if(!isComment(variables[i].lineNumber -1, comment.comments.lineComments, comment.comments.blockComments) && line.split('=')[1] !== undefined){
            let assignedValue = line.split('=')[1].replace(/\s/g, '').replace(';', '')
            let regex = new RegExp('[0-9][a-x0-9]+')
            let match = assignedValue.match(regex)
            if(match !== null && match[0].length === assignedValue.length && assignedValue.match('[a-z]+')){
                result.push(variables[i].lineNumber)
            }
        }
    }


    return result
}

const findErrors_2 = (data) => {
    let result = []
    for(let index = 0 ; index < data.length; ++index){
        let line = data[index]
        let regex =  /=(\s.*)?(\(.*\))?\dx[0-9a-zA-Z]*;/g
        let match = regex.exec(line)

        if(match !== null) {
            result.push(index+1)
        }
    }
    return result
}

export default cwe_587