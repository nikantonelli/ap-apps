
import Item from "@/pages/nui/card/[id]";
import { Box, Popover } from "@mui/material";
import React from "react";
import { APcard } from "./APcard";

export class APhoverCard extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			open: true,
			data: this.props.data,
			target: this.props.targetEl
		}
	}
	handleOpen = () => {
		this.setState({ open: true })
	}
	handleClose = () => {
		this.setState({ open: false })
	}
	render() {
		if (Boolean(this.state.data)) {
			return (
				<Box
					onMouseEnter={this.handleOpen}
					onMouseLeave={this.handleClose}
					
				>
					<Popover
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'left',
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'left',
						}}
						id={'cardPopper-' + this.state.data.id}
						open={this.state.open}
						anchorEl={this.state.target}
					>
						<APcard
							loadType='board' 
							readOnly={true}
							cardProps={{width:650}} 
							card={this.state.data} 
							host={window.location.host} 
						/>
					</Popover>
				</Box>
			)
		} else {
			return null;
		}
	}
}