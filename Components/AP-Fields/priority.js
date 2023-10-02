import { Chip, Grid, Menu, MenuItem, Paper } from "@mui/material";
import React from "react";

export class APPriority extends React.Component {

	static LEVELS = [ "critical", "high", "normal", "low"]
	constructor(props) {
		super(props);
		this.state = {
			menuAnchor: null
		}
	}

	
	updated = (evt) => {
		if (this.props.updated) {
			this.props.updated(evt.currentTarget.value)
		}
	}

	menuOpen = (evt) => {
		this.setState({menuAnchor: evt.currentTarget})
	}

	menuClose = (evt) => {
		this.setState({menuAnchor: null})
	}

	
	selectItem = (evt) => {
		if (this.props.updated) this.props.updated(APPriority.LEVELS[evt.currentTarget.value])
		this.menuClose()
	}

	render() {
		return (
			<>
				<Menu
					open={Boolean(this.state.menuAnchor)}
					anchorEl={this.state.menuAnchor}
					onClose={this.menuClose}
				>
					<MenuItem onClick={this.selectItem} value={0} >Critical</MenuItem>
					<MenuItem onClick={this.selectItem} value={1} >High</MenuItem>
					<MenuItem onClick={this.selectItem} value={2} >Normal</MenuItem>
					<MenuItem onClick={this.selectItem} value={3} >Low</MenuItem>
				</Menu>

				<Grid container sx={{ alignItems: 'center' }} direction="column" onClick={this.props.readOnly?null:this.menuOpen}>
					<Grid item>
						<Chip color={
							this.props.priority === "critical" ? "error" :
								(this.props.priority === "high") ? "warning" :
									(this.props.priority === "normal") ? "success" :
										"default"
						}
							label={this.props.priority} />
					</Grid>
					<Grid item>
						<Paper elevation={0}>Priority</Paper>
					</Grid>
				</Grid>
			</>
		)
	}
}
