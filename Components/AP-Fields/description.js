import { Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { Editor } from "../Editor/Editor";

export class APdescription extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Grid>
				<Paper elevation={0} className="title-paper"><Typography variant={this.props.headerType} className="title-field">Description</Typography></Paper>
				<Editor
					onChange={this.props.onChange}
					value={this.props.description || ""}
					type='description'
					label="Description"
				/>
			</Grid>
		)
	}
}
