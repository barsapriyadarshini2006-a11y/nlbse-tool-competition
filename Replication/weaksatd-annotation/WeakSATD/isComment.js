const isComment = (line, lineComments = [], blockComments = []) => {

    for(let i = 0 ; i < lineComments.length ; ++i){
        if(lineComments[i].loc.start.line === line){
            return true
        }
    }

    for(let i = 0 ; i < blockComments.length ; ++i){
        if(line >= blockComments[i].loc.start.line && line <= blockComments[i].loc.end.line ){
            return true
        }
    }



    return false
}

export default isComment