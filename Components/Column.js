import  React from "react";

export default class Column extends React.Component {
	constructor (props) {
		super(props)
	}
	render() {
		return ( <div className="column">
			{this.props.children}
		</div>)
	}
}