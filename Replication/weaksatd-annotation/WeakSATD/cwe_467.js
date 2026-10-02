//https://cwe.mitre.org/data/definitions/467.html

import {getPotentialMitigations} from "./findIssue.js";
import {findFunctions} from "./cwe_676.js";
import dataTypes from './cwe_467_listOfDataTypes.js'
import findCodeBlocks from './findCodeBlock.js'
import isComment from "./isComment.js";

let issueNumber = 467


const cwe_467 = (data, comment) => {

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": "",
        "lineNumbers": [],
        "issueNumber": issueNumber
    }

    try {

        let possibleProblems = findFunctions(data, ['sizeof'])
            //subtract 1, because the result is not in the corresponding array entry
            .map(single => single.lineNumber - 1)

        let result = []
        for (let i = 0; i < possibleProblems.length; ++i) {
            let codeBlock = findCodeBlocks.findUpperCodeBlock(possibleProblems[i], data)

            let variableDeclarations = findVariableDeclarations(data, dataTypes, codeBlock)
            let line = data[possibleProblems[i]]
            result.push(matchFunctionAndVariable(line, possibleProblems[i], variableDeclarations))
        }


        errors.lineNumbers = result
            .filter(single => single.length > 0)
            .flat()
            .map(single => single.lineNumber)
            .filter(single => !isComment(single, comment.comments.lineComments, comment.comments.blockComments))

        let text = result
            .filter(single => single.length > 0)
            .flat()
            .map(single => `in line ${single.lineNumber} the variable ${single.varName}`)
            .join(', ')

        errors.text = `In the following lines the sizeof function was male used: ${text}`

        let errorsFound = findFunctions(data, ['sizeof'])
            .filter(single => !isComment(single.lineNumber, comment.comments.lineComments, comment.comments.blockComments))
            .map(error => error.lineNumber)

        errors.lineNumbers = [errors.lineNumbers, errorsFound].flat()
    } catch {}

    return errors
}

export const findVariableDeclarations = (data, dataTypes, codeBlock) => {
    let varNames = []//{lineNumber: number, dataTyp: string, variableName: string}
    let start = 0//codeBlock.start === -1 ? 0 : codeBlock.start
    let end = data.length - 1//codeBlock.end === -1 ? data.length - 1  : codeBlock.end -1
    for (let i = start; i <= end; ++i) {
        for (let j = 0; j < dataTypes.length; ++j) {
            try {
                if (data[i].includes(`${dataTypes[j]}`)) {
                    let variable = findVariable(data[i], dataTypes[j])
                    if (variable !== undefined){
                        variable
                            .split(",")
                            .filter(elem => elem.replaceAll("\\s") !== "")
                            .map(varName => {
                                //console.log(varName)
                                varNames.push({
                                    lineNumber: i + 1,
                                    dataType: dataTypes[j],
                                    varName
                                })
                            })

                    }
                }
            } catch (e){}
        }
    }
    let result = []
    // filters out variables which have been recognised twice
    // unsigned int i
    // {unsigned int, i} and {int, i}
    for(let index = 0 ; index < varNames.length ; index++){
        if(
            !result.map(elem => elem.varName).includes(varNames[index].varName)
                &&
            !result.map(elem => elem.varName).includes(varNames[index].varName) === !dataTypes.includes(varNames[index].varName)){
            result.push(varNames[index])
        }
    }

    return result
}

const findVariable = (line, variableTyp) => {
    let result

    let varName = line.split(variableTyp)[1]

    result = varName.toString()
        .replace(/[^a-zA-Z0-9_=(,]/g, "")
        //.replace(/\s/g, '')
        //.replace(/;/g, '')
        //.replace(/\*/g, '')
        .split('=')[0]
    return result.includes('(') ? undefined : result
}

const matchFunctionAndVariable = (line, lineNumber, vars) => {
    let result = []//{lineNumber: number, dataType: string}


    let after = line.split('sizeof')[1]
    let end
    for (let i = 1; i < after.split('').length; ++i) {
        if (after[i] === ')') {
            end = i
            break
        }
    }


    let varName = after.split('').filter((single, index) => index >= 1 && index < end).join('')
    if (vars.filter(single => single.variable === varName).length === 0 && !varName.includes('*')) {
        result.push({
            lineNumber: lineNumber + 1,
            varName
        })
    }

    return result
}

export default cwe_467