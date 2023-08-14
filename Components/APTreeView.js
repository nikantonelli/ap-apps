import App from "./App";

export class APTreeView extends App {
    constructor(props) {
        super(props)
    }
    
    doit = () => {
                var svg = document.getElementById("svg_" + this.props.board.id);
				var viewWidth = svg.getBoundingClientRect().width;
				var colWidth = (viewWidth / (this.props.root.height || 1))
				var colMargin = 100
                var rowHeight = 30

				var tree = d3.tree()
					.nodeSize([rowHeight, colWidth])
					.separation(function (a, b) {
						return (a.parent === b.parent ? 1 : 1);
					}
					);

				tree(this.props.root);

				var smallestY = 0;
				var biggestY = 0;
				this.props.root.descendants().slice(1).forEach((d) => {
					if (d.x < smallestY) smallestY = d.x
					if (d.x > biggestY) biggestY = d.x
				})
				var viewBox = [viewWidth, (biggestY - smallestY) + rowHeight]
				svg.attr('width', viewBox[0] + (rowHeight / 2))
				svg.attr("height", viewBox[1] + rowHeight)
				svg.attr('viewBox', (colWidth - (rowHeight / 2)).toString() + ' ' + (smallestY - rowHeight) + ' ' + viewBox[0] + ' ' + (viewBox[1] + rowHeight))
				
				svg.attr('preserveAspectRatio', 'none');

				var nodes = svg.selectAll("g")
					.data(this.props.root.descendants().slice(1))
					.enter()

				var me = this;
                
				nodes.each(function (d) {
					d.colMargin = colMargin;
					d.colWidth = colWidth - colMargin;
					d.rowHeight = rowHeight;
				})



				nodes.append("clipPath")
					.attr("id", function (d, idx) { d.idx = idx; return "clip_" + idx })
					.append("rect").attr("id", function (d) { return "rect_" + d.depth + '_' + d.data.id })
					.attr("x", function (d) { return d.y })
					.attr("y", function (d) { return d.x - (d.rowHeight / 2) })
					.attr("width", function (d) { return d.colWidth })
					.attr("height", rowHeight)

				//Draw the first time so that we can get the sizes of things.
				//THe paths routine needs this info, but the side effect is that the bar that is
				//drawn obliterates the text. We redraw below......
				nodes.append("text")
					.attr("clip-path", function (d, idx) { return "url(#clip_" + idx + ")" })
					.text(d => me.getLabel(d))
					.attr("height", rowHeight)
					.attr("id", function (d) {
						return "text_" + d.depth + '_' + d.data.id
					})
					.attr("x", function (d) { return d.y + (d.rowHeight / 16) })
					.attr("y", function (d) { return d.x + (d.rowHeight / 8) })

				this.bars(nodes)
				this.paths(nodes)


				//Draw it twice so we can put it on top of the line
				nodes.selectAll("text").remove()
				nodes.each(function (p, idx, nodeArray) {
					var node = d3.select(this);
					node.append("text")
						.attr("clip-path", function (d) { return "url(#clip_" + d.idx + ")" })
						.text(d => me.getLabel(d))
						.attr("height", rowHeight - 12)
						.attr("id", function (d) {
							return "text_" + d.depth + '_' + d.data.id
						})
						.on('click', me.nodeClicked)
						.style("text-anchor", "start")
						.attr("x", function (d) { return d.y + (d.rowHeight / 16) })
						.attr("y", function (d) { return d.x + (d.rowHeight / 8) })
						.style('cursor', 'pointer')
						.append("title")
						.text(d => me.getTitle(d));
				})
		
    }
    getLabel = (d) => {
		switch (this.state.mode) {
			case 'sunburst': {
				return d.data.id === "root" ? "" : ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "") + d.data.id
			}

			default:
			case 'tree':
			case 'timeline':
			case 'partition': {
				return d.data.id === "root" ? "" : ((d.data.savedChildren && d.data.savedChildren.length) ? " **" : "") + d.data.title
			}
		}
	}

	getTitle = (d) => {
		switch (this.props.sort) {
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
		switch (this.state.colouring) {
			case 'state': {
				return (d.data.id === "root") ? "" :
					(d.data.lane.cardStatus === 'finished') ? ('Finished ' + shortDate(d.data.actualFinish)) :
						(d.data.lane.cardStatus === 'started') ? ('Started ' + shortDate(d.data.actualStart)) :
							"Not Started"
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
    bars = (nodes) => {
		var me = this;


		function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
			var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

			return {
				x: centerX + (radius * Math.cos(angleInRadians)),
				y: centerY + (radius * Math.sin(angleInRadians))
			};
		}

		function describeArc(x, y, radius, startAngle, endAngle) {

			var start = polarToCartesian(x, y, radius, endAngle);
			var end = polarToCartesian(x, y, radius, startAngle);

			var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

			var d = [
				"M", start.x, start.y,
				"A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
			].join(" ");
			return d;
		}

		nodes.each(function (d, idx, nodeArray) {
			var node = d3.select(this);
			var opacity = me.opacityDrop ? APBoard.OPACITY_HIGH : APBoard.OPACITY_MEDIUM;
			var colour = me.props.colourise(d);
			var rEl = document.getElementById("rect_" + d.depth + '_' + d.data.id)
			var tEl = document.getElementById("text_" + d.depth + '_' + d.data.id)

			var myWidth = (navigator.userAgent.indexOf("Firefox") >= 0) ?
				d3.min([d.colWidth, Number(rEl.attributes["width"].value)]) :
				d3.min([tEl.getClientRects()[0].width, rEl.getClientRects()[0].width])

			var eColour = me.props.errorColour(d);

			var g = node.append("g")

			g.append("line")
				.attr("id", function (d) { return "line_" + d.parent.data.id + '_' + d.data.id })
				.attr("stroke-width", d => d.rowHeight - 2)
				.attr("stroke", colour)
				.attr("opacity", function (d) { return opacity * d.opacity })

				.on('click', me.nodeClicked)
				.attr("x1", function (d) {
					return d.y
				})
				.attr("y1", function (d) {
					return d.x
				})
				.attr("x2", function (d) {
					return (d.y + (d.children ? (d.colWidth) : myWidth))
				})
				.attr("y2", function (d) {
					return d.x
				})

			if (eColour.length) {
				g.append("line")
					.attr("stroke-width", 3)
					.attr("stroke", eColour)
					.attr("opacity", opacity)

					.on('click', me.nodeClicked)
					.attr("x1", function (d) {
						return d.y
					})
					.attr("y1", function (d) {
						return d.x + (d.rowHeight / 2)
					})
					.attr("x2", function (d) {
						return (d.y + (d.children ? (d.colWidth) : myWidth))
					})
					.attr("y2", function (d) {
						return d.x + (d.rowHeight / 2)
					})
					.append("title").text(d => me.props.errorMessage(d))
			}

			//Start semi-circle
			g.append("path")
				.attr("d", function (d) {
					return describeArc(d.y
						, d.x, (d.rowHeight - 2) / 2, 180, 0)

				})
				.attr("opacity", function (d) { return opacity * d.opacity })
				.attr("fill", colour)

			//End semi-circle

			g.append("path")
				.attr("d", function (d) {
					var endpoint = (d.y + (d.children ? (d.colWidth) : myWidth))
					return describeArc(endpoint, d.x, (d.rowHeight - 2) / 2, 0, 180)

				})
				.attr("opacity", function (d) { return opacity * d.opacity })
				.attr("fill", colour)
				.append("title").text(d => me.props.errorMessage(d))
		})
	}

	paths = (nodes) => {
		nodes.each(function (d, idx, nodeArray) {
			var node = d3.select(this);
			var pWidth = 0;

			var pEl = document.getElementById("rect_" + d.parent.depth + '_' + d.parent.data.id);
			if (Boolean(pEl)) pWidth = (navigator.userAgent.indexOf("Firefox") >= 0) ?
				Number(pEl.attributes["width"].value) :
				pEl.getClientRects()[0].width

			node.append("path")
				.attr("id", function (d) { return "path_" + d.parent.data.id + '_' + d.data.id })
				.attr("class", function (d) { return "local--link"; })
				.attr("d", function (d) {
					var startPointH = d.parent.y + pWidth + (d.rowHeight / 2);
					var startApex = (d.y - (d.parent.y + pWidth)) / 2
					var startPointV = d.parent.x;
					var endPointH = d.y - (d.rowHeight / 2);
					var endPointV = d.x;

					var string = "M" + startPointH + "," + startPointV +
						"C" + (startPointH + (startApex)) + "," + (startPointV) + " " +
						(endPointH - (startApex)) + "," + endPointV + " " +
						endPointH + "," + endPointV;
					return string
				});
		})
	}
    render() {
        this.doit()
    }
}
