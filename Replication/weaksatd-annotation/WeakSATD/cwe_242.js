//https://cwe.mitre.org/data/definitions/242.html
//https://cwe.mitre.org/data/definitions/676.html

import {getPotentialMitigations} from "./findIssue.js";
import isComment from "./isComment.js";
import {findFunctions} from "./cwe_676.js"


const issueNumber = 242


const cwe_242 = (data, comment) => {
    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": "",
        "lineNumbers": []
    }


    let prohibitedFunctions = findFunctions(data, ["gets"])
        .filter(single => !isComment(single.lineNumber, comment.comments.lineComments, comment.comments.blockComments))

    errors.text = `In the following lines was one or more prohibited functions found: ${prohibitedFunctions.map(single => `in line: ${single.lineNumber} function: ${single.functionName}`).join(', ')}`

    errors.lineNumbers = prohibitedFunctions.map(single => single.lineNumber)

    return errors
}
export default cwe_242
