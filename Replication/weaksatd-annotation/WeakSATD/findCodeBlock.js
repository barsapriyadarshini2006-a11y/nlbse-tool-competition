/*
* INPUT:
* @startingPoint: line number where the comment was found
* @data: content of the file, split by \n
*
* OUTPUT:
* JSON-object with starting and ending line of the code block
*
* if no match was possible for both values -1 will be returned
* */

const findLowerCodeBlock = (startingPoint, data) => {

    let interimResult = {
        start: -1,
        end: -1
    }

    let result = {
        start: -1,
        end: -1
    }
    let reducedData = data
        .filter((_, index) => index >= startingPoint)
        .join("")
        .split("")


    let count = 0
    let countString = 0
    for (let i = 0; i < reducedData.length; ++i) {
        if(countString === 0 && reducedData[i] === '"') {
            countString++
        }
        else if(countString === 1 && reducedData[i] === '"'){
            countString--
        }
        else if (interimResult.start < 0 && reducedData[i] === '{' && countString === 0) {
            interimResult.start = i;
            count++;
        } //first opening bracket found, set start-index of the code block; count is set to one
        else if (interimResult.start >= 0 && reducedData[i] === '{' && countString === 0) {
            count++;
        } //if there are any more nested brackets count will be increased
        else if (interimResult.start >= 0 && count === 1 && reducedData[i] === '}' && countString === 0) {
            interimResult.end = i;
            break;
        } //the final closing bracket was found
        else if (interimResult.start >= 0 && count > 1 && reducedData[i] === '}' && countString === 0) {
            count--;
        } //a nested code block was found
        else if (interimResult.start < 0 && reducedData[i] === '}' && countString === 0) {
            break
        } //the first bracket what was found was a closing one, that indicates that there was no code block below the given starting point
    }
    if (interimResult.start >= 0) {
        let diff = interimResult.start
        let codeBlockLength = interimResult.end - interimResult.start
        let lineCount = startingPoint
        while (codeBlockLength >= 0) {
            while (diff >= 0) {
                diff = diff - data[lineCount].split('').length
                if (diff <= 0) {
                    codeBlockLength = codeBlockLength - Math.abs(diff)
                    result.start = lineCount + 1
                }
                ++lineCount
            }
            codeBlockLength = codeBlockLength - data[lineCount].split('').length
            if (codeBlockLength < 0) {
                result.end = lineCount + 1
            }
            ++lineCount
        }
    }
    return result
}


const findUpperCodeBlock = (startingPoint, data) => {
    let result = {
        start: -1,
        end: -1
    }
    let interimResult = {
        start: -1,
        end: -1
    }
    let findUpperStartingPoint = data.filter((_, index) => index < startingPoint).join("").split('')
    let count = 0
    let countString = 0
    for (let i = findUpperStartingPoint.length - 1; i >= 0; --i) {
        if(countString === 0 && findUpperStartingPoint[i] === '"') {
            countString++
        }
        else if(countString === 1 && findUpperStartingPoint[i] === '"'){
            countString--
        }
        else if (count === 0 && findUpperStartingPoint[i] === '{' && countString === 0) {
            interimResult.start = i;
            break;
        } else if (findUpperStartingPoint[i] === '}' && countString === 0) {
            count++
        } else if (count > 0 && findUpperStartingPoint[i] === '{' && countString === 0) {
            count--
        }
    }
    if (interimResult.start >= 0) {
        let diff = findUpperStartingPoint.length - interimResult.start
        let lineCount = startingPoint - 1
        while (diff > 0) {
            diff = diff - data[lineCount].split('').length
            --lineCount

            if (diff <= 0) {
                result.start = lineCount
            }


        }
        result = findLowerCodeBlock(result.start, data)
    }

    return result
}


export default {findLowerCodeBlock, findUpperCodeBlock}