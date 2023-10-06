import { ascending, descending, hierarchy, select } from "d3"
import { filter, union } from "lodash"
import { shortDate } from "./Helpers"
import { searchRootTree } from "./Sdk"

export function getLabel(d) {
    switch (this.view) {
        case 'sunburst': {
            return d.data.id === "root" ? this.props.context.title : ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "") + d.data.id
        }

        default:
        case 'tree':
        case 'timeline':
        case 'partition': {
            return d.data.id === "root" ? "Root" : ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "") + d.data.title
        }
    }
}

export const getSvgTitle = (d, sortBy, colourBy) => {
    switch (sortBy) {
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
    switch (colourBy) {
        case 'state': {
            return (d.data.id === "root") ? "" : (d.data.title + " (" +
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

export const compareSvgNode = (cmpType, cmpDir, a, b) => {
    var dirFnc = cmpDir === "ascending" ? ascending : descending
    switch (cmpType) {
        case 'size':
        case 'id':
        case 'title': {
            return dirFnc(a.data[cmpType], b.data[cmpType])
        }
        case 'count': {
            return dirFnc(a.value, b.value)
        }

        case 'score': {
            return dirFnc(a.data.scoring.scoreTotal, b.data.scoring.scoreTotal)
        }

        case 'plannedStart': {
            return dirFnc(new Date(a.data.plannedStart), new Date(b.data.plannedStart))
        }
        //Dates need to be backwards to be more useful: ascending means from now until later
        case 'plannedFinish': {
            return dirFnc(new Date(b.data.plannedFinish), new Date(a.data.plannedFinish))
        }
        case 'context': {
            return dirFnc(Number(a.data.board.id), Number(b.data.board.id))
        }
        case 'r_size': {
            return dirFnc(a.value, b.value)
        }

        default: {
            return dirFnc(a.data.id, b.data.id)
        }
    }
}

export const searchNodeTree = (element, id) => {
    if (element.data.id === id) {
        return element;
    }
    else if (Boolean(element.children)) {
        var i;
        var result = null;
        for (i = 0; result == null && i < element.children.length; i++) {
            result = searchNodeTree(element.children[i], id);
        }
        return result
    }
    return null;
}

export function svgNodeClicked(ev, target) {
    ev.stopPropagation()
    ev.preventDefault()
    if (ev.ctrlKey) {
        var participants = [target]
        if (ev.shiftKey) {
            var parent = target;
            while (parent.data.id !== "root") parent = parent.parent //Find the root
            participants = filter(parent.descendants(), function (d) {   //Find all those at the same depth
                return d.depth === target.depth
            })
        }

        if (target.data.children && target.data.children.length) {
            participants.forEach((pt) => {
                pt.data.savedChildren = union(pt.data.children, pt.data.savedChildren)
                pt.data.children = [];
            })
        }
        else if (target.data.savedChildren && target.data.savedChildren.length) {
            participants.forEach((pt) => {
                pt.data.children = pt.data.savedChildren;
                pt.data.savedChildren = [];
            })
        }
        this.setState((prev) => {
            var rNode = hierarchy(this.root)
            return { rootNode: rNode }
        })
    }
    else if (ev.shiftKey) {
        document.open("/nui/card/" + target.data.id, "", "noopener=true")
    }
    else if (ev.altKey) {

        if (target.data.id != 'root') {
            var newNode = searchNodeTree(this.rootNode, target.data.id)
            var newRoot = searchRootTree(this.root, target.data.id);
            var parent = searchRootTree(this.root, newNode.parent.data.id);
            if (this.focus === target.data.id) {
                if (parent && (parent.id !== 'root')) {
                    this.focus = parent.id;
                    this.setState({
                        rootNode: hierarchy(
                            {
                                id: 'root',
                                children: [parent]
                            }
                        )
                    })
                } else {
                    this.focus = null;
                    this.setState({
                        rootNode: hierarchy(this.root)
                    })
                }
            } else {
                this.focus = newRoot.id;
                this.setState({
                    rootNode: hierarchy(
                        {
                            id: 'root',
                            children: [newRoot]
                        }
                    )
                })
            }
        } else {
            this.focus = null;
            this.setState({
                rootNode: hierarchy(this.root)
            })
            select(".parentLabel").datum(target).text(d =>
                (d.data.id === "root" ? "" : d.data.id));
            select(".parentTitle").datum(target).text(d => {
                return d.data.title + " : " + d.data.size;
            })
            select(".parentNode").datum(target || this.rootNode);
        }
    } else {
        this.setState({ popUp: target.data.id })
    }
    return true;
}
