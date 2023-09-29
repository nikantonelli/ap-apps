import { Chip, Grid, Menu, MenuItem, Paper } from "@mui/material";
import React from "react";

/**
 * We rely on the parent to keep the 'state'
 */

export class APSize extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			menuAnchor: null
		}
	}

	render() {
		var sizeStr = ""
		switch (this.props.size) {
			case 0: {
				sizeStr = "Not Sized"
				break;
			}
			case 1: {
				sizeStr = "XS"
				break;
			}
			case 2: {
				sizeStr = "S"
				break;
			}
			case 3: {
				sizeStr = "S/M"
				break;
			}
			case 5: {
				sizeStr = "M"
				break;
			}
			case 8: {
				sizeStr = "L"
				break;
			}
			case 13: {
				sizeStr = "XL"
				break;
			}
			default: {
				sizeStr = "N/A";
				break;
			}

		}


		return (
			<>
				<Menu
					open={Boolean(this.state.menuAnchor)}
					anchorEl={this.state.menuAnchor}
					onClose={this.menuClose}
				>
					<MenuItem onClick={this.selectItem} value={1} >XS</MenuItem>
					<MenuItem onClick={this.selectItem} value={2} >S</MenuItem>
					<MenuItem onClick={this.selectItem} value={3} >S/M</MenuItem>
					<MenuItem onClick={this.selectItem} value={5} >M</MenuItem>
					<MenuItem onClick={this.selectItem} value={8} >L</MenuItem>
					<MenuItem onClick={this.selectItem} value={13} >XL</MenuItem>
				</Menu>

				<Grid onClick={this.props.readOnly?null:this.menuOpen} id="size-container" container sx={{ alignItems: 'center' }} direction="column">
					<Grid item>
						<Chip label={Boolean(this.props.size) ? this.props.size : " -- "} />
					</Grid>
					<Grid item>
						<Paper elevation={0}>{sizeStr}</Paper>
					</Grid>
				</Grid>
			</>
		)
	}

	menuOpen = (evt) => {
		this.setState({menuAnchor: evt.currentTarget})
	}

	menuClose = () => {
		this.setState({menuAnchor: null})
	}

	selectItem = (evt) => {
		if (this.props.updated) this.props.updated(evt.currentTarget.value)
		this.menuClose()
	}
}
