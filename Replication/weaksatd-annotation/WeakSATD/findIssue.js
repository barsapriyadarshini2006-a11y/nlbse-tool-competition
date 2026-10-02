import data from "./cwe_issues.json" assert { type: 'json' };

export function findIssueByID(issueNumber) {
    let issue = data.Weakness_Catalog.Weaknesses.Weakness.filter(single => issueNumber.toString() === single.ID)
    if (issue.length === 0) {
        throw new Error("ID not found")
    }
    return issue
}

const reducer = (phase) => { // converts the phase to a string if its an array
    let result = ''
    if (Array.isArray(phase)) { //true or false
        result = phase
            .map(single => `${single}`)  // flats the structure of the array and shapes the output of a single mitigation
            .join(", ") // joins multiple mitigation's, if there are more than one
    } else {
        result = phase
    }
    return result
}

export function getPotentialMitigations(issueNumber) {
    let result = []

    try {
        let issue = findIssueByID(issueNumber)
        let mitigations = issue[0].Potential_Mitigations.Mitigation
        if (mitigations.length !== undefined) { //true or false (for array or object)
            mitigations
                .map(single => result.push({phase: reducer(single.Phase), description: single.Description})) // flats the structure of the array and shapes the output of a single mitigation
        } else {
            result.push({phase: reducer(mitigations.Phase), description: mitigations.Description})
        }
    } catch (e) {
        result = e.message
    }
    return result
}