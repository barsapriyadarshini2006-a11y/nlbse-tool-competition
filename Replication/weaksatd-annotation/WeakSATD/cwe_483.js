//https://cwe.mitre.org/data/definitions/467.html

import {getPotentialMitigations} from "./findIssue.js";
import indicators from "./cwe_483_wordList.js";
import isComment from "./isComment.js";

let issueNumber = 483

const cwe_483 = (data, comments) => {
    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": "In the following lines was an incorrect block Delimitation found:",
        "lineNumbers": [],
        "issueNumber": issueNumber
    }
    try {
        let possibleError = findIndicators(data, comments, indicators)

        //deletes if indicators for the list if in the same line is an else if
        for (let i = 1; i < possibleError.length; ++i) {
            if (possibleError[i - 1].lineNumber === possibleError[i].lineNumber) {
                possibleError.splice(i, 1)
            }
        }

        let possibleErrorForElse = findElse(data, comments, possibleError)

        for (let i = 0; i < possibleError.length; ++i) {
            //calculates the indexes which are interesting to scan
            let index = possibleError[i].lineNumber - 1
            let indexNext = i < possibleError.length - 1 ? possibleError[i + 1].lineNumber : data.length - 1
            let join = data
                .slice(index, indexNext)
                .join('')
            //finds the start of the sacn
            let regex = new RegExp(`${possibleError[i].indicator}`, 'g')
            let start = regex.exec(join)
            join = join.slice(start.index, join.length)
            let joinSplit = join.split('')
            let count = 0
            //finds the end of the condition block example: if(condition)
            for (let k = 0; k < joinSplit.length; ++k) {
                if (count === 0 && joinSplit[k] === '(') {
                    count++
                } else if (count > 0 && joinSplit[k] === '(') {
                    count++
                } else if (count > 1 && joinSplit[k] === ')') {
                    count--
                } else if (count === 1 && joinSplit[k] === ')') { //found last closing braked
                    count--
                    start = k + 1
                    break
                }
            }
            //generates a new list with the updated starting point
            join = join.slice(start, join.length)
            joinSplit = join.split('')
            //scans for the first non whitespace
            //if it is an opening curly braked all is fine
            //if it is not an opening curly braked or a whitespace it can be added to the list
            for (let j = 0; j < joinSplit.length; ++j) {
                if (joinSplit[j] === '{') {
                    break
                } else if (/\S/.test(joinSplit[j])) {
                    errors.lineNumbers.push(possibleError[i])
                    break
                }
            }
        }

        //does the same but only for else
        //this step was mandatory because else as indicator has no condition block
        for (let i = 0; i < possibleErrorForElse.length; ++i) {
            //calculates the indexes which are interesting to scan
            let index = possibleErrorForElse[i] - 1
            let indexNext = i < possibleErrorForElse.length - 1 ? possibleErrorForElse[i + 1] : data.length - 1
            let join = data
                .slice(index, indexNext)
                .join('')
            //finds the start of the sacn
            let regex = new RegExp(`else`, 'g')
            let start = regex.exec(join)
            join = join.slice(start.index + 4, join.length)
            let joinSplit = join.split('')
            //scans for the first non whitespace
            //if it is an opening curly braked all is fine
            //if it is not an opening curly braked or a whitespace it can be added to the list
            for (let j = 0; j < joinSplit.length; ++j) {
                if (joinSplit[j] === '{') {
                    break
                } else if (/\S/.test(joinSplit[j])) {
                    errors.lineNumbers.push({lineNumber: possibleErrorForElse[i], indicator: 'else'})
                    break
                }
            }
        }


        //sorts the lineNumbers, due the later calculation of else the order got disturbed
        errors.lineNumbers.sort(function (a, b) {
            return a.lineNumber - b.lineNumber
        })
        errors.lineNumbers = errors.lineNumbers.filter(single => checkForDoWhile(single, data, single.lineNumber - 1))
        errors.text += errors.lineNumbers.map(single => ` in line ${single.lineNumber} and the indicator was ${single.indicator}`).join(', ')

        errors.lineNumbers = checkForMultiline(data, errors.lineNumbers)

        errors.lineNumbers = errors.lineNumbers.map(single => single.lineNumber)
    } catch {}


    return errors
}

const check_leftover = (data, problematic_line, match) => {
    // The indicator condition goes over multiple lines
    if(match === undefined){
        const regex = new RegExp(`.*${problematic_line.indicator}\\s*`)
        let line = data[problematic_line.lineNumber-1].replace(regex, "") // starting point is the opening bracket of the condition body
        let count = 0;
        for(let index = 0 ; index < data.length-1; index++){
            const char = line.split("")
            for(let idx = 0;idx<char.length;idx++){
                //counting the brackets till the last one is found
                if(count === 0 && char[idx] === '(') { count++ }
                else if(count > 0 && char[idx] === '(') { count++ }
                else if(count > 1 && char[idx] === ')') { count-- }
                else if(count === 1 && char[idx] === ')') { //found last closing braked
                    // no need to check for { as this was done before
                    return [char.slice(idx+1).join(""), index]
                }
            }
            line = data[problematic_line.lineNumber + index]
        }
    }

    return [match, 0]
}

const findNextNoneEmptyLine = (data, lineNumber) => {
    let line = data[lineNumber]
    let skipped = 0
    for(let index = lineNumber;index < data.length;++index){
        line = data[index]
        if(line.replaceAll(/\s/g,"") === ""){
            skipped++
        } else {
            break
        }
    }

    return [line, skipped]
}

const findEndOfIndicator = (data, indicator) => {
    if(indicator.indicator === "else"){
        return [data[indicator.lineNumber-1], 0]
    }
    let counter = 0
    let skipped = 0
    const regex = new RegExp(`${indicator.indicator}\\s*`)
    let code = data[indicator.lineNumber - 1].split(regex)
    code = code.slice(1, code.length).join("").split("")
    for(let index = 0;index<code.length;++index){
        if(code[index] === "("){
            counter++
        }
        if(code[index] === ")"){
            counter--
        }
        if(counter === 0){
            return [code.slice(index+1, code.length).join(""), skipped]
        }
        if(index === code.length-1){
            // next line
            skipped++
            index = 0
            code = data[indicator.lineNumber - 1 + skipped].split("")
        }
    }
}

const checkForMultiline = (data, lineNumbers) => {

    for(let index = 0;index < lineNumbers.length;++index){
        const [leftover, modifier] = findEndOfIndicator(data, lineNumbers[index])
        lineNumbers[index]["leftover"] = leftover
        lineNumbers[index]["modifier"] = modifier
    }

    //console.table(lineNumbers)

    const validated = []

    for (const index in lineNumbers) {
        const line = lineNumbers[index]
        let leftover = lineNumbers[index].leftover
        let modifier = lineNumbers[index].modifier
        const regex = new RegExp(`${lineNumbers[index].indicator}\\s*`)
        const numberOfSpacesForIndicator = data[lineNumbers[index].lineNumber - 1].split(regex)[0].split("").length
        if (leftover === ""){
            const [code_line_one, skipped_1] = findNextNoneEmptyLine(data, line.lineNumber + modifier)
            const [code_line_two, skipped_2] = findNextNoneEmptyLine(data, line.lineNumber + 1 + modifier + skipped_1)

            let numberOfSpacesOne = numberOfSpaces(code_line_one.split(""))
            let numberOfSpacesTwo = numberOfSpaces(code_line_two.split(""))

            if(numberOfSpacesOne === numberOfSpacesTwo && checkForReturnAndClosingBracket(code_line_two.split(""))) {
                validated.push(line)
            }
        } else {
            const code_line_one = data[line.lineNumber + modifier].split("")
            let numberOfSpacesOne = numberOfSpaces(code_line_one)
            if(numberOfSpacesOne > numberOfSpacesForIndicator && checkForReturnAndClosingBracket(code_line_one)) {
                validated.push(line)
            }
        }

    }


    return validated
}

const checkForReturnAndClosingBracket = (code_line) => {
    code_line = code_line.join("").replace(/\s/g, "").split("")

    if(code_line.length === 0 || code_line[0].match(/[a-zA-Z]/) == null){
        return false
    }

    return code_line.join("").match(/^return/) == null;
}

const numberOfSpaces = (code_line) => {
    for (let i = 0;i < code_line.length;++i){
        if(code_line[i].match(/\s/) === null){
            return i
        }
    }
    return code_line.length
}

const checkForDoWhile = (single, data, line) => {
    if(single.indicator !== "while"){
        return true
    }

    const before = [...data].splice(0, line - 1)
    before.push(data[line].split("while")[0])
    const beforeArray = before.join("").replace(/\s/g, "").split("").reverse()
    let countBrackets = 0

    for(const index in beforeArray){
        const element = beforeArray[parseInt(index)]
        // first char before while (excluding whitespaces) is not a closing bracket
        if(parseInt(index) === 0 && element !== "}"){
            return true
        }

        //counting curly brackets until the start was fund
        if(element === "}"){
            countBrackets++
        }
        if(element === "{"){
            countBrackets--
        }

        //first 2 characters after the closing bracket are "o" and "d" (do) such that is can be ignored, as it is correct code!
        if(countBrackets === 0 && parseInt(index)>=2 && beforeArray[parseInt(index)+1] === "d" && beforeArray[parseInt(index)] === "o"){
            return false
        }
    }
    return true
}

export default cwe_483

export function findIndicators(data, comments, indicators) {

    let indicatorsFound = [] //{lineNumber: number, indicator:string}
    // eslint-disable-next-line
    data.map((single, i) => {
        // eslint-disable-next-line
        for(let j = 0 ; j < indicators.length; ++j) {
            let regex = new RegExp(`(\\s|^)${indicators[j]}\\s*\\(`, 'g')
            if (single.match(regex) && !isComment(i + 1, comments.comments.lineComments, comments.comments.blockComments)) {
                indicatorsFound.push({lineNumber: i + 1, indicator: indicators[j]})
            }
        }
    })

    return indicatorsFound
}

function findElse (data, comments, possibleErrors) {
    let result = [] //lineNumber eq.:[1, 3, 5, 32]
    for(let i = 0 ; i < data.length ; ++i){
        if(data[i].toLowerCase().split(' ').includes('else')){
            //checks if a line is a comment and if a line was found as else if
            if(
                !isComment(i + 1, comments.comments.lineComments, comments.comments.blockComments)
                &&
                !possibleErrors.filter(single => single.lineNumber === i + 1 && single.indicator === 'else if').length > 0
            ){
                result.push(i + 1)
            }
        }
    }
    return result
}