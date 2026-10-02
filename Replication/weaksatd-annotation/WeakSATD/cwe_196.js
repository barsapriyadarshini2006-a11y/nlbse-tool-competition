//https://cwe.mitre.org/data/definitions/196.html

import {getPotentialMitigations} from "./findIssue.js";
import {findVariableDeclarations} from "./cwe_467.js";
import dataTypes from "./cwe_467_listOfDataTypes.js";
import {findErrorsSignAndUnsignedConversionError} from "./cwe_195.js";

let issueNumber = 196

const cwe_196 = (data, comment) => {

    let errorsFound = findErrorsSignAndUnsignedConversionError(data, comment, findVariableDeclarations(data, dataTypes, {start: -1, end: -1}))
    let lineNumbers = []
    for(let i = 0 ; i < errorsFound.length ; ++i) {
        if(!errorsFound[i].dest.includes('unsigned')){
            if(Array.isArray(errorsFound[i].source)){
                if(errorsFound[i].source.filter(single => !single.includes('unsigned')).length === 0){
                    lineNumbers.push(errorsFound[i])
                }
            }
            else {
                if(errorsFound[i].source.includes('unsigned')){
                    lineNumbers.push(errorsFound[i])
                }
            }
        }
    }

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": `In the following lines a conversions error from unsigned to signed was detected: ${lineNumbers.map(single => `in line ${single.lineNumber}`).join(', ')}`,
        "lineNumbers": lineNumbers.map(single => single.lineNumber),
        "issueNumber": issueNumber
    }

    return errors
}

export default cwe_196