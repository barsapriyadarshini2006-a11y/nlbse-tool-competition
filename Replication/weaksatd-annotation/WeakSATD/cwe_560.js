//https://cwe.mitre.org/data/definitions/560.html
//https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.3.0/com.ibm.zos.v2r3.bpxbd00/rtchm.htm use of chmod
//https://www.ibm.com/support/knowledgecenter/en/SSLTBW_2.1.0/com.ibm.zos.v2r1.bpxbd00/rtuma.htm use of umask

import {getPotentialMitigations} from "./findIssue.js";
import {findFunctions} from "./cwe_676.js";
import {functionArguments} from "./cwe_806.js";


let issueNumber = 560

const cwe_560 = (data, comments) => {

    let errorsFound = findErrors(data, comments, findFunctions(data, ['umask']))

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": `In the following line the function umask was with chmod-style argument used: ${errorsFound.map(single => `in line ${single}`).join(", ")}`,
        "lineNumbers": errorsFound.map(single => single.lineNumber),
        "issueNumber": issueNumber
    }

    return errors
}

const findErrors = (data, comments, umasks) => {
    let result = []
    for(let i = 0 ; i < umasks.length; ++i){
        let fArguments = functionArguments(data[umasks[i].lineNumber - 1], 'umask').join('')
        if(fArguments.split(',').length > 1){
            result.push(umasks[i].lineNumber)
        }
    }
    return result
}

export default cwe_560