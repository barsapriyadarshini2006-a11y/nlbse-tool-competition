//https://cwe.mitre.org/data/definitions/243.html

import {getPotentialMitigations} from "./findIssue.js";
import {findFunctions} from "./cwe_676.js";
import isComment from "./isComment.js";

let issueNumber = 243

const cwe_243 = (data, comment) => {

    let errorsFound = findFunctions(data, ['chroot'])
        .filter(single => !isComment(single.lineNumber, comment.comments.lineComments, comment.comments.blockComments))

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": `In the following line the command chroot was used: ${errorsFound.map(single => `in line ${single.lineNumber}`).join(", ")}`,
        "lineNumbers": errorsFound.map(single => single.lineNumber),
        "issueNumber": issueNumber
    }

    return errors
}

export default cwe_243