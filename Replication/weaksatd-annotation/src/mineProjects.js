import {
    fs,
    path,
    saveData,
    importData,
    execCLI,
    extractCommentsFromSRCML,
    importXML2JSON,
    removeCommentsFromCode
} from "./utility.js"
import isComment from "../WeakSATD/isComment.js";


const resultFileNames = ["Filename"]
const samples = "./samples"

let startingFolder = './chromiumMining'
let dataFolder = 'chromium'
let pathExtractedFunctions = `${startingFolder}/extractedFunctions/`
const pathAllFiles = `${startingFolder}/allFiles.csv`
const pathAllCFiles = `${startingFolder}/allCFiles.csv`

function setProject(projectName) {
    if(projectName === "chromium"){
        startingFolder = './chromiumMining'
        dataFolder = 'chromium'
        pathExtractedFunctions = `${startingFolder}/extractedFunctions/`
    } else if(projectName === "linux"){
        startingFolder = './linuxMining'
        dataFolder = 'linux'
        pathExtractedFunctions = `${startingFolder}/extractedFunctions/`
    } else if(projectName === "firefox"){
        startingFolder = './firefoxMining'
        dataFolder = 'mozilla-central'
        pathExtractedFunctions = `${startingFolder}/extractedFunctions/`
    } else {
        throw new Error("Project name not found")
    }
}

setProject(process.argv[2])

function findFileNames(subPath){
    const absolutePaths = fs.readdirSync(subPath)
    absolutePaths.forEach(absolutePath => {
        const absolute = path.join(subPath, absolutePath)
        if(fs.statSync(absolute).isDirectory()){
            findFileNames(absolute)
        } else {
            resultFileNames.push(absolute)
        }
    })
}

async function extractPaths() {
    findFileNames(`${startingFolder}/${dataFolder}`)

    await saveData(resultFileNames.join("\n"), pathAllFiles, true)

    const data = (await importData(pathAllFiles, true))
        .split("\n")

    data
        .shift()

    const cleaned = data
        .filter(file => {
            const fileEnding = file.split(".").at(-1)
            return fileEnding === "c" || fileEnding === "h"
        })

    cleaned
        .unshift("Filename")

    console.log(cleaned.length)
    await saveData(cleaned.join("\n"), pathAllCFiles, true)

}

async function generateSRCMLFiles() {
    const data = (await importData(pathAllCFiles, true))
        .split("\n")

    data
        .shift()

    for (let index = 0; index < data.length; index++) {
        const path = data[index]
        const doesTheFileExists = await importData(path, true)
        if(doesTheFileExists !== undefined) {
            await execCLI(`srcml --position ${path} -o ${path}.xml`)
        }

        console.log(`${index} out of ${data.length} or ${index / data.length} files are completed`)
    }
}

async function extractComments(){
    const data = (await importData(pathAllCFiles, true))
        .split("\n")

    data
        .shift()

    for (let index = 0; index < data.length; index++) {
        const path = `${data[index]}.xml`
        const doesTheFileExists = await importData(path, true)
        if(doesTheFileExists !== undefined) {
            await extractCommentsFromSRCML(path)
        }

        console.log(`${index} out of ${data.length} or ${index / data.length} files are completed`)
    }
}

async function extractFunctions(){
    let counterFiles = 1
    //const data = await loadDataFromCopiedFolder()
    const data = (await importData(pathAllCFiles, true))
        .split("\n")

    data
        .shift()

    const csv = ["originalFileName;functionIndicator"]

    let count = 0
    for(let index = 0 ; index < data.length; index++){
        const pathC = data[index]
        console.log(pathC)
        const dataC = (await importData(pathC, true)).split(/\r?\n/)
        const xmlAsJSON = await importXML2JSON(`${pathC}.xml`)
        const commentsC = await importData(`${pathC}.xml.comment.json`)
        const dataCWithOutComments = removeCommentsFromCode((await importData(pathC, true)).split(/\r?\n/), commentsC)

        const methods = xmlAsJSON.unit.function

        for (let indexMethods = 0; methods !== undefined && indexMethods < methods.length; indexMethods++) {
            const method = methods[indexMethods]
            let startLine = method.ATTR["pos:start"].split(":")[0] - 1
            let startLinePosition = method.ATTR["pos:start"].split(":")[1] - 1
            let endLine = method.ATTR["pos:end"].split(":")[0] - 1
            let endLinePosition = method.ATTR["pos:end"].split(":")[1]
            const data = []

            for(let indexLine = startLine ; indexLine <= endLine ; indexLine++){
                if ( indexLine === startLine ) {
                    data.push(dataC[indexLine].split("").slice(startLinePosition, dataC[indexLine].length).join(""))
                } else if ( indexLine === endLine) {
                    data.push(dataC[indexLine].split('').slice(0, endLinePosition).join(""))
                } else {
                    data.push(dataC[indexLine])
                }
            }

            //adds empty lines and comments before the extracted function header
            for(let index = startLine - 1 ; index >= 0 ; index--){
                const line = index + 1

                if(
                    (
                        dataC[index].replaceAll("\s", "") === "" ||
                        isComment(line, commentsC.comments.lineComments, commentsC.comments.blockComments)
                    ) && dataCWithOutComments[index].replaceAll("\s", "") === ""
                ){
                    data.unshift(dataC[index])
                } else {
                    break
                }
            }

            // remove marko at the end, they look like:
            // #....
            // it goes through the extracted source code from bottom to top

            for (let indexData = data.length - 1; indexData >= 0; indexData--) {
                if(
                    (
                        data[indexData].replaceAll("\s") === "" ||      // removes empty lines
                        data[indexData].replaceAll("\s", "")[0]==="#"   // removes lines at the end of the extracted file which contain makros
                    ) && !isComment(indexData+1, commentsC.comments.lineComments, commentsC.comments.blockComments)
                ){
                    data.pop()
                } else {
                    break
                }
            }

            await saveData(data.join("\n"), `${pathExtractedFunctions}${counterFiles}.c`, true)
            csv.push(`${pathC};${pathExtractedFunctions}${counterFiles}.c`)
            counterFiles++

        }

        console.log(`${index} out of ${data.length} or ${index / data.length} files are completed - ${counterFiles} functions extracted!`)
    }

    await saveData(csv.join("\n"), `${pathExtractedFunctions}eval.csv`, true)


}


await extractPaths() // finds all paths
await generateSRCMLFiles() // generates xml file for all c related files
await extractComments() // extracts comments for all c related files
await extractFunctions() // extract functions