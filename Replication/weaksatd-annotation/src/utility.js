import * as fs from 'fs';
import * as path from 'path';
import asyncCSV from "async-csv"
import cliProgress from "cli-progress"
import util from "util";
import {exec} from "child_process";
import xml2js from "xml2js";

function extractComments(data) {

    let result = {'comments': {}}

    result.comments['lineComments'] = singleLineComment(data)

    result.comments['blockComments'] = multiLineComment(data)

    return result
}

function singleLineComment(data){
    let result = []
    for (let i = 0; i < data.length; ++i) {
        if (data[i].split('//').length > 1) {
            result.push({
                loc: {
                    start: {
                        line: i + 1,
                        location: data[i].split('//')[0].length
                    }
                },
                value: data[i].split('//')[1]
            })
        }
    }
    return result
}

function multiLineComment(data){
    let result = []
    let start = -1
    for (let i = 0; i < data.length; ++i) {
        if (start < 0 && data[i].split('/*').length > 1) {
            start = i
            i--//is needed to detect multiline comments over one line ex.: /* multiline comment in a single line */
        } else if (start >= 0 && data[i].split('*/').length > 1) {
            result.push({
                loc: {
                    start: {
                        line: start + 1,
                        location: data[start].split("/*")[0].length
                    },
                    end: {
                        line: i + 1,
                        location: data[start]
                            .split("*/")
                            .splice(0, data[start].split("*/").length - 1)
                            .map((elem, index) => elem.length + 2)
                            .reduce((acc, sum) => acc + sum, 0)
                    }
                },
                // eslint-disable-next-line
                value: data.filter((single, index) => (index >= start && index <= i)).join(" "),
            })
            start = -1
        }
    }
    return result
}

// reads csv file async
async function read_csv(path){
    const data = fs.readFileSync(path)
    const rows = await asyncCSV.parse(data)
    const header = rows[0]
    await rows.shift()
    return [header, rows]
}

// extracts comments
function extract_comments(code){
    const regex = new RegExp("((\\/\\*([\\s\\S]*?)\\*\\/)|((?<!:)\\/\\/.*))", "gmi")
    return [...code.matchAll(regex)]
}

// removes comments from code
function remove_comment_from_code(code, comments){
    let codeWithoutComments = code
    for(let indexComment = 0 ; indexComment < comments.length; indexComment++){
        const comment = comments[indexComment][0]
        const numberOfNewLines = comment.split("\n").length - 1
        codeWithoutComments = codeWithoutComments.replace(comment, "\n".repeat(numberOfNewLines))
    }
    return codeWithoutComments
}

function checkIfFolderExists(path){
    for(let index = 1 ; index < path.split("/").length ; index++)
    {
        const checkFolder = path.split("/").splice(0, index).join("/")
        if (!fs.existsSync(checkFolder)) {
            fs.mkdirSync(checkFolder);
        }
    }
}


async function findComments(obj, result, depth = 0) {
    const keys = Object.keys(obj)
    for (let indexKey = 0; indexKey < keys.length; indexKey++) {
        const key = keys[indexKey]
        if(key === "comment"){
            //console.log(obj["comment"])
            const comments = obj["comment"]
            for(let indexComment = 0 ; indexComment < comments.length ; indexComment++){
                const comment = comments[indexComment]
                if(comment.ATTR.type === "line" && comment.ATTR["pos:start"] !== undefined){
                    result.comments.lineComments.push({
                        loc: {
                            start: {
                                line: parseInt(comment.ATTR["pos:start"].split(":")[0]),
                                location: parseInt(comment.ATTR["pos:start"].split(":")[1]) - 1
                            }
                        },
                        value: comment._
                    })
                } else if(comment.ATTR.type === "block"){
                    result.comments.blockComments.push({
                        loc: {
                            start: {
                                line: parseInt(comment.ATTR["pos:start"].split(":")[0]),
                                location: parseInt(comment.ATTR["pos:start"].split(":")[1]) - 1
                            },
                            end: {
                                line: parseInt(comment.ATTR["pos:end"].split(":")[0]),
                                location: parseInt(comment.ATTR["pos:end"].split(":")[1])
                            }
                        },
                        value: comment._
                    })
                }
            }
        }

        //break condition for recursive function - the content within "obj[key]" isnt an object anymore!
        if(typeof obj[key] === "object" && !Array.isArray(obj[key] && obj[key] !== null)) {
            await findComments(obj[key], result, depth + 1)
        }
    }
}

const parser = new xml2js.Parser({ attrkey: "ATTR" })
async function importXML2JSON(path){
    const xmlData = await importData(path, true)
    const xmlAsJSON = await parser.parseStringPromise(xmlData)

    return xmlAsJSON
}

async function extractCommentsFromSRCML(path){
    const xmlAsJSON = await importXML2JSON(path)

    const result = {
        comments: {
            lineComments: [],
            blockComments: []
        }
    }

    await findComments(xmlAsJSON, result)


    //sorting
    result.comments.lineComments.sort((a, b) => a.loc.start.line - b.loc.start.line)
    result.comments.blockComments.sort((a, b) => a.loc.start.line - b.loc.start.line)

    await saveData(result, `${path}.comment.json`)
}

async function importData(path, text = false){
    try {
        let rawData = await fs.readFileSync(path, {encoding: 'utf8', flag: 'r'})
        return text ? rawData : await JSON.parse(rawData)
    } catch (e) {
        //console.log(e)
    }
}

function saveData(data, path, text = false){
    try {
        checkIfFolderExists(path)
        fs.writeFileSync(path, text ? data : JSON.stringify(data))
    } catch (e) {
        console.log(e)
    }
}

function to_csv(data, path, header){
    const CODE = header.indexOf("Function")
    const LeadingComment = header.indexOf("LeadingComment")
    const result = data
        .map((row, index) => {
            // double quotes need to be enhanced by an additional quote to not be misinterpreted by the parser
            // It was tried with pandas and the JS parser in this file and with both it worked
            if(index !== 0){
                row[CODE] = row[CODE].replaceAll('"', '""')
                row[CODE] = `"${row[CODE]}"`
                row[LeadingComment] = row[LeadingComment].replaceAll('"', '""')
                row[LeadingComment] = `"${row[LeadingComment]}"`
            } else {
                console.log(row)
            }
            return row.join(",")
        })
    if(fs.existsSync(path)) {
        fs.unlinkSync(path)
    }
    const pbar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy)
    pbar.start(result.length, 0)
    for(let i = 0;i<result.length;++i){
        fs.appendFileSync(path, result[i]+"\n")
        pbar.update(pbar.value+1)
    }
    pbar.stop()
}

function set_vulnerable(cwe_function, codeWithoutComments, comments, tentative_result) {
    if(tentative_result === 1){
        return 1
    }
    const f = cwe_function(codeWithoutComments, comments)
    return f.lineNumbers.length > 0 ? 1 : 0
}

const execAsync = util.promisify(exec)

async function execCLI(command){
    const { stdout, stderr } = await execAsync(command);
    return { stdout, stderr }
}


function removeCommentsFromCode(code, comments){
    comments.comments.lineComments
        .reverse()
        .map(comment => {
            code[comment.loc.start.line - 1] = code[comment.loc.start.line - 1]
                .split("")
                .splice(0, comment.loc.start.location)
                .join("")
        })

    // removes block comments which are just in a single line, e.g. /* comment */
    comments.comments.blockComments
        .filter(comment => comment.loc.start.line === comment.loc.end.line) // only same line block comments
        .reverse()
        .map(comment => {
            code[comment.loc.start.line - 1] = code[comment.loc.start.line - 1].split(comment.value).join("")
        })

    // removes block comments which are in multiple lines, e.g. /* comment
    comments.comments.blockComments
        .filter(comment => comment.loc.start.line !== comment.loc.end.line)
        .map(comment => {
            code[comment.loc.start.line - 1] = code[comment.loc.start.line - 1]
                .split("")
                .splice(0, comment.loc.start.location)
                .join("")

            for(let index = comment.loc.start.line ; index < comment.loc.end.line - 1 ; index++){
                code[index] = ""
            }

            code[comment.loc.end.line - 1] = code[comment.loc.end.line - 1]
                .split("*/")[1]
        })

    return code

}

export {
    extractComments,
    fs,
    path,
    read_csv,
    extract_comments,
    set_vulnerable,
    to_csv,
    remove_comment_from_code,
    saveData,
    importData,
    execCLI,
    extractCommentsFromSRCML,
    importXML2JSON,
    removeCommentsFromCode
}