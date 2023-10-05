import { Paper, Typography, Grid } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React from "react";
import { cloneDeep } from "lodash";
import { titleFieldStyle, titlePaperStyle } from "../styles/globals";
import { shortDate } from "../Utils/Client/Helpers";
import { statusString } from "../Utils/Client/Sdk";
export class ConnectionTable extends React.Component {
	columns = [
		{ field: 'title', headerName: 'Title', width: 400 },
		{
			field: 'customId', headerName: 'Header', width: 200,
			valueGetter: (params) =>
				`${params.row.customId.value || ''}`
		},
		{
			field: 'board', headerName: 'Context', width: 400,
			valueGetter: (params) =>
				`${params.row.board.title || ''}`
		},
		{
			field: 'status', headerName: 'Status', width: 400,
			valueGetter: (params) => {
				return statusString(params.row)
			}
		},

	]
	constructor(props) {
		super(props)
		this.state = {
			idString: Boolean(this.props.title) ? "connection-" + this.props.title.toLowerCase().replace(/[^a-z0-9]/g, "-") : "connection-grid",
			scaledColumns: this.columns
		}
	}


	openBoard = (evt) => {
		document.open("/nui/context/" + evt.currentTarget.id, "", "noopener=true")
	}

	openCard = (evt) => {
		document.open("/nui/card/" + evt.id, "", "noopener=true")
	}

	onResize = (size) => {
		var scaledColumns = cloneDeep(this.columns)
		//Get the scaling of the columns
		var scaling = 0;
		this.columns.forEach((column) => {
			scaling += column.width;
		})
		scaledColumns.forEach((column) => {
			column.width = Math.floor(column.width * size.width / scaling);
		})
		this.setState({ scaledColumns: scaledColumns })
	}

	render() {
		if (Boolean(this.props.items)) {
			return (
				<>
					<Paper square elevation={0}  sx={titlePaperStyle}><Typography variant={this.props.titleType} sx={titleFieldStyle}>{this.props.title}</Typography></Paper>

					<DataGrid
						rows={this.props.items}
						columns={this.state.scaledColumns}
						initialState={{
							pagination: {
								paginationModel: { page: 0, pageSize: 5 },
							},
						}}
						pageSizeOptions={[5, 10, 20]}
						disableRowSelectionOnClick
						autoHeight
						onRowClick={this.openCard}
						onResize={this.onResize}
					/>
				</>
			)
		} else {
			return null;
		}
	}
}