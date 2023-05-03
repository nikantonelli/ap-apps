import CardService from "@/services/CardService";
import { DataProvider } from "@/utils/DataProvider";
import { CancelPresentation, Delete, DeleteForever, ExpandMore, Label, Logout, SaveAltOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActionArea, CardActions, CardContent, CardHeader, Grid, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { $getRoot, $getSelection } from 'lexical';
import React from "react";

import { Editor } from "@/utils/Editor";
import { createEditor } from 'lexical';
import { getCardChildren, getListOfCards } from "@/utils/Sdk";

export default class Item extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: props.card,
			description: props.card || props.card.description,
			detailsSection: true,
			connectionsSection: false,
			peopleSection: false
		}
		this.editor = createEditor();
	}

	handleBlock = () => {
		var data = this.state.data;
		data.blocked = !data.blocked;
		this.setChanged(data);
	}

	updateDescription = (e) => {
		if (this.isChanged !== true) {
			return;
		}
		var data = this.state.data;
		this.setChanged(data);
	}

	updateTitle = (e) => {
		if (this.isChanged !== true) {
			return;
		}
		var data = this.state.data;
		this.setChanged(data);
	}

	setChanged = (data) => {
		if (!this.isChanged) {
			this.savedData = this.state.data;
		}
		this.setState({ data: data });
		this.isChanged = true;
	}

	descriptionChanged = (e, dirty) => {
		this.isChanged = true;
		this.savedData = this.state.data;
		if (dirty) {
			this.setState((prevState) => {
				var data = prevState.data;
				data.description = JSON.stringify(e)
				return { data: data }
			})
		}

	}

	titleChanged = (e) => {
		var data = this.state.data;
		data.title = e.target.value.substr(0, 127);
		this.setChanged(data);
	}

	checkBeforeLeave = (e) => {
		if (this.isChanged) {
			SdkUtils.showError({ message: "Save/Cancel changes before leaving page" });
			e.preventDefault();
			e.returnValue = ''
		}
		window.removeEventListener('beforeunload', this.checkBeforeLeave);
	}

	refresh = () => {

	}

	cancelChanges = (e) => {
		if (this.isChanged) {
			this.isChanged = false;
			this.setState({ data: this.savedData })
		}
	}

	handleAccordionChange = (event, requestedState) => {
		var ed = {};
		ed[event.currentTarget.id] = requestedState;
		this.setState(ed);
	}

	componentDidMount = () => {
		var data = this.state.data;
		getCardChildren(this.props.host, data).then((children) => {
			this.setState({ children: children })
			getListOfCards(this.props.host, data.parentCards.map((card) => card.cardId)).then((parents) => {
				this.setState({ parents: parents })
			})

		})
	}

	componentDidUpdate = () => {
		const contentEditableElement = document.getElementById('description-editor')
		this.editor.setRootElement(contentEditableElement);
	}

	render() {
		var sectionHeaderType = "h5"
		var sectionHeaderType = "h6"
		var me = this;
		if (this.props.card != null) {
			return (
				<Card variant='outlined' iid={this.state.data.id}>

					<CardActionArea>
						<CardActions style={{ backgroundColor: this.state.data.type.cardColor, justifyContent: 'center' }} >
							<Tooltip title="Save Changes">
								<IconButton
									sx={{ backgroundColor: '#fff', fontSize: '28px' }}
									aria-label='save card'
									onClick={this.checkUpdates}
									color={this.isChanged ? 'error' : 'default'}
								>
									<SaveAltOutlined />
								</IconButton>
							</Tooltip> <Tooltip title={this.isChanged ? "Save and Close" : "Close"}>
								<IconButton
									sx={{ backgroundColor: '#fff', fontSize: '28px' }}
									aria-label='save if needed, and close'
									onClick={this.updateDataClose}
									color={this.isChanged ? 'error' : 'default'}
								>
									<Logout />
								</IconButton>
							</Tooltip>

							<Tooltip title="Cancel Changes">
								<IconButton sx={{ backgroundColor: '#fff', fontSize: '28px' }} aria-label='cancel changes' onClick={this.cancelChanges}>
									<CancelPresentation />
								</IconButton>
							</Tooltip>

							<Tooltip title="Send to Recycle Bin">
								<IconButton sx={{ backgroundColor: '#fff', fontSize: '28px' }} aria-label="send to recycle bin" onClick={this.deleteRecycle}>
									<Delete />
								</IconButton>
							</Tooltip>

							<Tooltip title="Delete Forever">
								<IconButton sx={{ backgroundColor: '#fff', fontSize: '28px' }} aria-label="delete forever" onClick={this.deleteForever} >
									<DeleteForever />
								</IconButton>
							</Tooltip>
						</CardActions>
					</CardActionArea>


					<CardContent sx={{ backgroundColor: this.state.data.type.cardColor }}>
						<Accordion expanded={this.state.detailsSection} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="details-content" id="detailsSection" expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>{this.state.detailsSection ? "Details" : this.state.data.title}</Typography>
							</AccordionSummary>
							<Grid container >
								<Grid item margin={'10px'} className='card-description-field' >
									<Stack>
										<Paper className='title-margin' elevation={0} ><Typography>Title</Typography></Paper>
										<TextField

											variant="outlined"
											className='card-description-field'
											value={this.state.data.title}
											onBlur={this.updateTitle}
											onChange={this.titleChanged}
										/>
									</Stack>
								</Grid>
								<Grid item margin={'10px'} className='card-description-field'>
									<Stack>
										<Paper elevation={0} ><Typography>Description</Typography></Paper>
										<Editor
											onBlur={this.updateDescription}
											onChange={this.descriptionChanged}
											value={this.state.data.description || ""}
											className='editor'
											label="Description"
										/>
									</Stack>
								</Grid>

							</Grid>
						</Accordion>
						<Accordion expanded={this.state.connectionsSection} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="connections-content" id="connectionsSection" expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Connections</Typography>
							</AccordionSummary>
							<AccordionDetails>

							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state.peopleSection} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="people-content" id="peopleSection" expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>People</Typography>
							</AccordionSummary>
							<AccordionDetails>
								Text
							</AccordionDetails>
						</Accordion>
					</CardContent>


				</Card>
			)
		} else {
			return <div id="dead" />
		}
	}
}


export async function getServerSideProps({ req, params, query }) {
	if (globalThis.dataProvider == null) {
		globalThis.dataProvider = DataProvider.get()
	}
	var cs = new CardService(req.headers.host);
	var card = await cs.get(params.id)
	if (card) {

		return { props: { card: card, host: req.headers.host } }
	}
	return { props: { card: null, host: req.headers.host } }
}