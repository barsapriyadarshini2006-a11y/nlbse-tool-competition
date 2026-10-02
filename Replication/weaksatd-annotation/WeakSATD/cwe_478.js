// https://cwe.mitre.org/data/definitions/478.html
import {getPotentialMitigations} from "./findIssue.js";

const issueNumber = 478

export function cwe_478(data, comment) {
    let possibleError = findSwitch(data)

    let errors = {
        "mitigation": getPotentialMitigations(issueNumber),
        "text": "",
        "lineNumbers": [],
        "lineNumbersInformation": [],
        "issueNumber": issueNumber
    }

    //console.log(possibleError)

    if (possibleError.length > 0) {
        for (let i = 0; i < possibleError.length; ++i) {
            let countBrackets = 0 //closing brackets
            for(let index = possibleError[i] - 1 ; index < data.length; ++index){
                let line = data[index]
                if(index === possibleError[i] - 1){
                    line = line.split(/switch\s*\(\s*.*\s*\)/)[1]
                }
                const lineSplit = line.replace(/\s/g, "").split("")
                for(let indexChar = 0 ; indexChar < lineSplit.length ; ++indexChar){
                    const char = lineSplit[indexChar]
                    if(char === "{"){
                        ++countBrackets
                    }
                    if(char === "}"){
                        --countBrackets
                    }

                    if(line.includes("default:")){
                        indexChar = lineSplit.length
                        index = data.length
                    }
                    if(countBrackets === 0 ){
                        errors.lineNumbers.push(index+1)
                        errors.lineNumbersInformation.push({
                            "switch":possibleError[i],
                            "closingOfSwitchBlock":index+1
                        })
                        indexChar = lineSplit.length
                        index = data.length
                    }
                }

            }
        }
    }

    errors.text = `In the following lines ${errors.lineNumbers.join(', ')} the error was detected!`

    return errors
}

export function findSwitch(data) {

    let switchFound = []
    // eslint-disable-next-line
    data.map((single, i) => {
        if (single.match(/(^|\s)switch\s*\(\s*.*\s*\)/g)) { //detects all switches
            switchFound.push((i + 1)) // array starts from 0 but the line count starts from 1
        }
    })

    return switchFound
}

export default cwe_478