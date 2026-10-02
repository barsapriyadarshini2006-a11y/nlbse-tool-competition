//https://cwe.mitre.org/data/definitions/783.html

import {getPotentialMitigations} from "./findIssue.js";
import indicators, {level} from "./cwe_783_wordList.js";
import isComment from "./isComment.js";
import dataTypes from './cwe_467_listOfDataTypes.js'

let issueNumber = 783


function countOccurrences(string, subString) {
    // Escape special characters in the subString to avoid regex interpretation
    const escapedSubString = subString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Create a regular expression with the escaped subString and the global flag
    const regex = new RegExp(escapedSubString, 'g');
    // Use match() to find all occurrences of the subString in the string
    const matches = string.match(regex);
    // Return the number of matches found
    return matches ? matches.length : 0;
}


const cwe_783 = (data, comments) => {

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": "",
        "lineNumbers": [],
        "issueNumber": issueNumber
    }

    let potentialErrors = findLinesWithMoreThan3Indicators(data, comments, indicators)
    potentialErrors = potentialErrors
        .filter(single => amountOfLevels(single) > 1)
    let delete_index = []
    for(let i in potentialErrors){
        const indicators = potentialErrors[i].indicators
        const result = []
        for(let indicator_i = 0;indicator_i<indicators.length;indicator_i++){
            result.push(indicators[indicator_i])
            if(indicators[indicator_i][0] === "=="){
                indicator_i = indicator_i +2
            }
        }
        potentialErrors[i].indicators = result

        if(result.length === 2){
            let params = [result[0][0], result[1][0]]
            if(JSON.stringify(params)===JSON.stringify(["=", "=="])){
                let line = result[0]["input"]
                let in_between = line.match("=.*==")[0]
                let count_opening = countOccurrences(in_between, "(")
                let count_closing = countOccurrences(in_between, ")")
                if(count_opening!==count_closing){
                    delete_index.push(i)
                }
                if(line.includes("if") || line.includes("for") || line.includes("while")){
                    delete_index.push(i)
                }
            }

        }
    }

    for(let index in delete_index){
        potentialErrors.splice(1, delete_index[index])
    }

    for(let error in potentialErrors){
        let line = potentialErrors[error]
        let start = line.indicators[0].index
        let end = line.indicators[0].index
        for(let indicator in line.indicators){
            if(start > line.indicators[indicator].index){
                start = line.indicators[indicator].index
            }
            if(end < line.indicators[indicator].index){
                end = line.indicators[indicator].index
            }
        }
        let part = data[line.line-1].split('').slice(start, end+1)
        let countOpening = 0
        let countClosing = 0
        for(let single in part){
            if(part[single] === '('){
                countOpening++
            }
            if(part[single === ')']){
                countClosing++
            }
        }
        if(line.indicators.length -2 > countClosing+countOpening){
            errors.lineNumbers.push(line.line)
        }
    }

    errors.lineNumbers = errors.lineNumbers
        .filter(single => checkForInclude(single, data))
        .filter(single => checkForVector(single, data))
        .filter(single => checkForVariable(single, data))

    errors.text = `In the following lines the expression in which operator precedence causes incorrect logic is in use: ${errors.lineNumbers.map(single => `in line ${single}`).join(', ')}`
    return errors
}

function splitMulti(str, tokens){
    let tempChar = tokens[0]; // We can use the first token as a temporary join character
    for(var i = 1; i < tokens.length; i++){
        str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    return str;
}

const checkForVariable = (line, data) => {
    let content = splitMulti(data[line - 1].replace(/\s/g, ""), ['&', '*'])
    for(let i = 0 ; i < content.length - 1; ++i){
        let lastChar = content[i][content[i].length - 1]
        let nextChar = content[i + 1] && content[i + 1][0]
        let regex = new RegExp('[a-zA-Z0-9]')
        try {
            if (!lastChar.match(regex)) {
                return false
            }
            if (nextChar && !nextChar.match(regex)) {
                return false
            }
        }catch (e){}
    }
    return true
}

const checkForVector = (line, data) => {
    let content = data[line - 1]
    let amountSmaller = content.split('<').length - 1
    let amountBigger = content.split('>').length - 1
    return !(amountSmaller === amountBigger && amountSmaller > 1)
}

const checkForInclude = (line, data) => {
    return !data[line-1].includes('include')
}

const amountOfLevels = (potentialErrorsSingle) => {
    let result = []
    for(let i = 0 ;i<potentialErrorsSingle.indicators.length;++i){
        for(let key in level){
            if(level[key].includes(potentialErrorsSingle.indicators[i][0])){
                result.push(key)
            }
        }
    }
    return result.filter((single, index) => index === result.indexOf(single)).length
}

const findLinesWithMoreThan3Indicators = (data, comments, indicators) => {
    let result = [] //{line: number, indicators:[string]}
    let count
    for(let line in data) {
        count = []
        if (!isComment(parseInt(line) + 1, comments.comments.lineComments, comments.comments.blockComments)) {
            //let lineSplit = splitMulti(line, [',', ';'])
            for (let indicator in indicators) {
                let regex = new RegExp(`${indicators[indicator]}`, 'g')
                let match
                while ((match = regex.exec(data[line])) != null) {
                    if (match) {
                        count.push(match)
                    }
                }
            }
            if (count.length >= 2) {
                result.push({
                    line: parseInt(line) + 1,
                    indicators: count
                })
            }
        }
    }

    for(let i = 0 ; i < result.length; ++i){
        result[i].indicators.sort((a,b) => a.index-b.index)
    }

    return checkForPointer(checkForDuplicates(result), data)
}

const checkForDuplicates = (data) => {
    const potentialDuplicates = ['+', '-', '&', '|', '<', '>']
    for(let i = 0;i< data.length;++i){
        let line = data[i]
        for(let j = 0;j < line.indicators.length - 1;++j){
            let indicator = line.indicators[j][0]
            let nextIndicator = line.indicators[j+1][0]
            //console.log('////////')
            //console.log(indicator)
            //console.log(nextIndicator)
            if(
                potentialDuplicates.includes(indicator)
                &&
                indicator === nextIndicator
                &&
                line.indicators[j].index + 1 === line.indicators[j+1].index
            ){
                data[i].indicators.splice(j, 2)
            }
            else if(
                indicator === '-'
                &&
                nextIndicator === '>'
                &&
                line.indicators[j].index + 1 === line.indicators[j+1].index
            ){
                data[i].indicators.splice(j, 2)
            }
        }
    }
    return data.filter(single => single.indicators.length >= 3)
}

const checkForPointer = (interimResult, data) => {
    dataTypes.push('wchar_t')
    for(let i = 0;i < interimResult.length;++i){
        let line = interimResult[i]
        for(let j = 0;j < line.indicators.length;++j){
            if(line.indicators[j][0] === '*'){
                for(let dataType in dataTypes) {
                    let regex = new RegExp(`${dataTypes[dataType]}\\s*\\*`, 'g')
                    let match
                    while ((match = regex.exec(data[interimResult[i].line - 1]))) {
                        // eslint-disable-next-line
                        let found = line.indicators.filter(single => match.index+match[0].length - 1 === single.index)
                        for(let remove in found){
                            line.indicators.splice(line.indicators.indexOf(found[remove]))
                        }
                    }
                }
            }
        }
    }
    return interimResult.filter(single => single.indicators.length >= 3)
}

export default cwe_783