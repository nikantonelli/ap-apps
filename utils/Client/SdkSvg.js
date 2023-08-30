import { shortDate } from "./Helpers"

export const getLabel = (me, d) => {
    switch (me.mode) {
        case 'sunburst': {
            return d.data.id === "root" ? me.props.board.title : ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "") + d.data.id
        }

        default:
        case 'tree':
        case 'timeline':
        case 'partition': {
            return d.data.id === "root" ? "" : ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "") + d.data.title
        }
    }
}

export const getTitle = (me, d) => {
    switch (me.sort) {
        case 'plannedStart': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + shortDate(d.data.plannedStart) + ")")
        }
        case 'plannedStart': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + shortDate(d.data.plannedFinish) + ")")
        }
        case 'score': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.scoring.scoreTotal + ")")
        }
        case 'context': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.board.title + ")")
        }
        case 'a_user': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + (d.data.assignedUsers && d.data.assignedUsers.length ? d.data.assignedUsers[0].fullName : "No User") + ")")
        }
        case 'r_size':
        case 'size': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.size + "/" + d.value + ")")
        }
        default: {
            //Fall out and try something else - usally if set to 'none'
        }
    }

    /** If we don't get it on the sortType, use the colouring type next. Usually means sortType is 'size' */
    switch (me.colouring) {
        case 'state': {
            return (d.data.id === "root") ? "" :(d.data.title + " (" + 
                ((d.data.lane.cardStatus === 'finished') ? ('Finished: ' + shortDate(d.data.actualFinish)) :
                    (d.data.lane.cardStatus === 'started') ? ('Started: ' + shortDate(d.data.actualStart)) :
                        ("Not Started: " + shortDate(d.data.plannedStart))
                ) + ")")
        }
        case 'context': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.board.title + ")")
        }
        case 'type': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.type.title + ")")
        }
        case 'l_user': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.updatedBy.fullName + ")")
        }
        case 'c_user': {
            return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.createdBy.fullName + ")")
        }
    }
    return d.data.id === "root" ? "" : (d.data.title + " (" + d.data.size + "/" + d.value + ")")
}