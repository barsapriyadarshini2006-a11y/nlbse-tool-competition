//https://cwe.mitre.org/data/definitions/242.html
//https://cwe.mitre.org/data/definitions/676.html

import {getPotentialMitigations} from "./findIssue.js";
import functionList from './cwe_676_wordList.js'
import isComment from "./isComment.js";


const issueNumber = 676

const cwe_676 = (data, comment) => {
    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": "",
        "lineNumbers": []
    }


    let prohibitedFunctions = findFunctions(data, functionList)
        .filter(single => !isComment(single.lineNumber, comment.comments.lineComments, comment.comments.blockComments))

    errors.text = `In the following lines was one or more prohibited functions found: ${prohibitedFunctions.map(single => `in line: ${single.lineNumber} function: ${single.functionName}`).join(', ')}`

    errors.lineNumbers = prohibitedFunctions.map(single => single.lineNumber)


    return errors
}


/*
* input:
* output:
* desc:
* */
const findFunctions = (data, functionList) => {
    let result = [] //{line: number, functionName: string}
    for (let i = 0; i < data.length; ++i) {
        for (let j = 0; j < functionList.length; j++) {
            let regex = new RegExp(`(^|\\s|;)${functionList[j]}\\s*\\(.*`, 'g')
            //matches the regex to a single data line
            if (data[i].match(regex)) {
                result.push({
                    lineNumber: i + 1, //because we start to count from 1 and not 0 in file lines
                    functionName: functionList[j]
                })
            }
        }
    }
    return result
}


export {findFunctions}
export default cwe_676
