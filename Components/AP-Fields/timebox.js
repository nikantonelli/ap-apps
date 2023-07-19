import { FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material";
import React from "react";

export class APtimebox extends React.Component {

	/**
	 * 
	 * @param {initialTimeBox, timeBoxChange, timeboxes} props 
	 */
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<FormControl sx={{ minWidth: 600 }} variant="filled">
				<InputLabel>{this.props.title}</InputLabel>
				<Select
					value={this.props.initialTimeBox ? this.props.initialTimeBox : ""}
					onChange={this.props.timeBoxChange}
					label={this.props.title}
				>
					{this.props.timeboxes.length? this.props.timeboxes.map((timebox, idx) => {
						return <MenuItem key={idx} value={timebox.id}>{timebox.label}</MenuItem>
					})
					:null
					}
				</Select>
			</FormControl>
		)
	}
}
