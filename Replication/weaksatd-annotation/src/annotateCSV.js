import cliProgress from "cli-progress"
import cwe_478 from "../WeakSATD/cwe_478.js";
import cwe_483 from "../WeakSATD/cwe_483.js";
import cwe_242 from "../WeakSATD/cwe_242.js";
import cwe_676 from "../WeakSATD/cwe_676.js";
import cwe_415 from "../WeakSATD/cwe_415.js";
import cwe_416 from "../WeakSATD/cwe_416.js";
import cwe_783 from "../WeakSATD/cwe_783.js";
import cwe_467 from "../WeakSATD/cwe_467.js";
import cwe_401 from "../WeakSATD/cwe_401.js";
import cwe_244 from "../WeakSATD/cwe_244.js";
import cwe_243 from "../WeakSATD/cwe_243.js";
import cwe_195 from "../WeakSATD/cwe_195.js";
import cwe_196 from "../WeakSATD/cwe_195.js";
import cwe_135 from "../WeakSATD/cwe_135.js";
import cwe_14 from "../WeakSATD/cwe_14.js";
import cwe_690 from "../WeakSATD/cwe_690.js";
import cwe_587 from "../WeakSATD/cwe_587.js";
import cwe_781 from "../WeakSATD/cwe_781.js";
import cwe_782 from "../WeakSATD/cwe_782.js";
import cwe_560 from "../WeakSATD/cwe_560.js";
import cwe_806 from "../WeakSATD/cwe_806.js";
import { extractComments, fs, set_vulnerable, to_csv, read_csv, extract_comments, remove_comment_from_code } from "./utility.js";


const PATH = process.argv[2] !== undefined && process.argv[2]
if(!PATH){
    console.log("No provided CSV file! Exiting...")
    process.exit(-1)
}
const PARTS = !isNaN(process.argv[4]) ? parseInt(process.argv[4]) : 10
const PART = !isNaN(process.argv[3]) ? parseInt(process.argv[3]) : 1
const [header, data] = await read_csv(PATH)
const CODE = header.indexOf("Function")
let VULNERABLE = header.indexOf("WeakSATD")
if(VULNERABLE === -1){
    header.push("WeakSATD")
    VULNERABLE = header.indexOf("WeakSATD") === -1
}
console.log(header)

// calculates chunk
const start = Math.ceil((PART-1)*data.length/PARTS)
const end = Math.ceil((PART)*data.length/PARTS)
const data_slice = data.slice(start, end)

// creates progressbar based on chunk size
const pbar = new cliProgress.SingleBar({}, cliProgress.Presets.legacy)
pbar.start(data_slice.length, 0)

//iterates over chunk
for(let index = 0 ; index < data_slice.length; ++index){
    const code = data_slice[index][CODE]
    const comments = extract_comments(code)
    const codeWithoutComments = remove_comment_from_code(code, comments).split("\n")
    let result = 0

    result = set_vulnerable(cwe_478, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_483, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_242, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_676, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_415, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_416, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_783, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_467, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_401, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_244, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_243, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_195, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_196, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_135, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_14, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_690, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_587, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_781, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_782, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_560, codeWithoutComments, extractComments(codeWithoutComments), result)
    result = set_vulnerable(cwe_806, codeWithoutComments, extractComments(codeWithoutComments), result)


    data_slice[index].push(`${result}`)

    pbar.update(pbar.value + 1);
}

// closes progressbar
pbar.stop();

to_csv([header, ...data_slice], `./${PART}.csv`, header)


// finds all files in the folder CFL and filters for those which have been created within the process
const regex =  `[${Array.from({ length: PARTS }, (_, index) => (index + 1).toString()).join("|")}].csv`
const files = fs
    .readdirSync(".")
    .filter(file => file.match(regex))

if(files.length === PARTS){
    let result = []
    for(let index = 0; index < files.length; index++){
        console.log(index)
        console.log(files[index])
        const [header, data] = await read_csv(`./${files[index]}`)
        if(result.length === 0){
            result = [header, ...data]
        } else {
            result = [...result, ...data]
        }
    }
    to_csv(result, "./complete_new.csv", result[0])
}

console.log("finished")