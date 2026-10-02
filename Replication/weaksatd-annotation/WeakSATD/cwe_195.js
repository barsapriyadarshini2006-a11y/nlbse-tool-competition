//https://cwe.mitre.org/data/definitions/195.html

import {getPotentialMitigations} from "./findIssue.js";
import {findVariableDeclarations} from "./cwe_467.js";
import dataTypes from "./cwe_467_listOfDataTypes.js";
import isComment from "./isComment.js";
import {findFunctions} from './cwe_676.js'

let issueNumber = 195

const cwe_195 = (data, comment) => {


    let errorsFound = findErrorsSignAndUnsignedConversionError(data, comment, findVariableDeclarations(data, dataTypes, {start: -1, end: -1}))



    let lineNumbers = []
    for(let i = 0 ; i < errorsFound.length ; ++i) {
        if(errorsFound[i].dest.includes('unsigned')){
            if(Array.isArray(errorsFound[i].source)){
                if(errorsFound[i].source.filter(single => single.includes('unsigned')).length === 0){
                    lineNumbers.push(errorsFound[i])
                }
            }
            else {
                if(!errorsFound[i].source.includes('unsigned')){
                    lineNumbers.push(errorsFound[i])
                }
            }
        }
    }

    findFunctions(data, ['malloc', 'strncpy', 'memcpy', 'memmove'])
        .map(elem => lineNumbers.push(elem))

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": `In the following lines a conversions error from signed to unsigned was detected: ${lineNumbers.map(single => `in line ${single.lineNumber}`).join(', ')}`,
        "lineNumbers": lineNumbers.map(single => single.lineNumber),
        "issueNumber": issueNumber
    }
    return errors
}

export const findErrorsSignAndUnsignedConversionError = (data, comment, vars) => {
    let result = []
    //console.log(vars)
    vars = vars
        .filter(single =>
            (single.variable && single.variable.match(/[a-zA-Z_0-9]/))
            &&
            !isComment(single.lineNumber, comment.comments.lineComments, comment.comments.blockComments)
            &&
            !single.variable.includes('(')
            &&
            !single.variable.includes('}')
            &&
            !single.variable.includes(')')
            &&
            !single.variable.includes('{')
        )

    let dest
    let source
    for(let i = 0; i < data.length;++i){
        let match = data[i].match('=')
        dest = null
        source = null
        if(match && data[i][match.index+1] !== '='){
            let split = data[i].replaceAll(/\s*/g, '').replace(";", "").split('=')

            dest = matchVarLeft(split[0], vars) !== null ? matchVarLeft(split[0], vars) : split[0].toLowerCase()


            if(split.length > 1){
                source = matchVarRight(split[1], vars) !== null ? matchVarRight(split[1], vars) : split[1].toLowerCase()
            }

            if(dest !== null && source !== null && dest !== source){
                result.push({
                    dest,
                    source,
                    lineNumber: i + 1
                })
            }
        }
    }

    return result
}

// returns the datatype
const matchVarLeft = (left, vars) => {
    for(let i = 0 ; i < vars.length; ++i){
        try {
            let regex = new RegExp(`(?![a-zA-Z0-9])\\s*${vars[i].variable}\\s*(?![a-zA-Z0-9])`)
            let match = regex.exec(left)
            if (match) {
                let before = left[match.index] ? left[match.index] : ' '
                let next = left[match.index + 1 + vars[i].variable.length] ? left[match.index + 1 + vars[i].variable.length] : ' '
                if (before.match('\\s') && next.match('[\\s\\=]')) {
                    return vars[i].dataType
                }
            }
        }catch (e) {}
    }
    return null
}

//returns array of possible datatype
const matchVarRight = (right, vars) => {
    for(let i = 0 ; i < vars.length; ++i){
        try {
            let regex = new RegExp(`\\s*${vars[i].variable}\\s*;`)
            let match = right.match(regex)
            if (match) {
                return vars[i].dataType
            }
            try {
                // eslint-disable-next-line
                let result = eval(right)
                if (result >= 0) {
                    if (result.toString().includes('.')) {
                        return ['unsigned float', 'unsigned double', "double", "float"]
                    }
                    return ['unsigned char','unsigned int', 'unsigned short', 'unsigned long', 'unsigned float', "unsigned double", 'char','int', 'short', 'long', 'float', 'double']
                } else {
                    if (result.toString().includes('.')) {
                        return ["double", "float"]
                    }
                    return ['char','int', 'short', 'long', 'float', 'double']
                }
            } catch (e) {
            }
            for (let j = 0; j < dataTypes.length; ++j) {
                regex = new RegExp(`\\(${dataTypes[j]}\\)\\s*[a-zA-Z0-9\\.\\-\\+\\/\\*]+;`)
                match = right.match(regex)
                if (match) {
                    return dataTypes[j]
                }
            }
        } catch (e){}
    }
    return null
}
export default cwe_195