import CardService from "@/services/CardService";
import { DataProvider } from "@/utils/DataProvider";
import { CancelPresentation, ConnectingAirports, Delete, DeleteForever, ExpandMore, KeyboardDoubleArrowDown, KeyboardDoubleArrowUp, List, Logout, People, SaveAltOutlined } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActionArea, CardActions, CardContent, Grid, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import React from "react";

import { Editor } from "@/Components/Editor/Editor";
import { getCardChildren, getListOfCards, getBoard } from "@/utils/Sdk";
import { ConnectionTable } from "@/Components/ConnectionTable";
import { AssignedUserTable } from "@/Components/AssignedUserTable";
import { CardUserTable } from "@/Components/CardUserTable";

export default class Item extends React.Component {

	static CONNECTIONS_PANEL_NAME = "connectionsSection";
	static PEOPLE_PANEL_NAME = "peopleSection";
	static DETAILS_PANEL_NAME = "detailsSection";
	static SCHEDULE_PANEL_NAME = "scheduleSection"

	constructor(props) {
		super(props);
		this.state = {
			data: props.card,
			description: props.card || props.card.description,
			changed: false,
			descendants: [],
			parents: [],
			context: null
		}
		this.state[Item.CONNECTIONS_PANEL_NAME] = false;
		this.state[Item.PEOPLE_PANEL_NAME] = false;
		this.state[Item.DETAILS_PANEL_NAME] = false;
		this.state[Item.SCHEDULE_PANEL_NAME] = false;
		
		this.savedData = props.card;
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
		var data = { ...this.state.data };
		this.setChanged(data);
	}

	updateTitle = (e) => {
		if (this.isChanged !== true) {
			return;
		}
		var data = { ...this.state.data };
		this.setChanged(data);
	}

	setChanged = (data) => {
		this.setState({ data: data });
		this.isChanged = true;

	}

	/**
	 * 
	 * @param {*} editorValue 
	 * 
	 * Description Editor is a lexical richtexteditor
	 * that needs special attention.
	 */
	descriptionChanged = (editorValue) => {
		if (!this.dscrEditorLoaded) {
			this.dscrEditorLoaded = true;
		} else {
			if (!this.dispatchDescClear) {
				var data = { ...this.state.data }
				data.description = editorValue
				this.setChanged(data)
			}
			this.dispatchDescClear = false
		}
	}

	titleChanged = (e) => {
		var data = { ...this.state.data };
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

	cancelChanges = (e) => {
		this.isChanged = false;
		this.setState({ data: this.savedData })
		this.dispatchDescClear = true;
		window.dispatchEvent(new Event('clear-editor-description'));
	}

	handleAccordionChange = (event, requestedState) => {
		var ed = {};
		ed[event.currentTarget.id] = requestedState;
		this.setState(ed);
	}

	componentDidMount = () => {
		var data = this.state.data;

		//Get the connection info
		getCardChildren(this.props.host, data).then(async (children) => {
			var childArray = await children.json()
			this.setState({ descendants: childArray.cards })
			if (data.parentCards && data.parentCards.length) {
				getListOfCards(this.props.host, data.parentCards.map((card) => card.cardId)).then(async (parents) => {
					var parentArray = await parents.json()
					this.setState({ parents: parentArray.cards })
				})
			}
		})

		//Get the context info
		getBoard(this.props.host, this.state.data.board.id).then(async (info) => {
			var board = await info.json()
			this.setState({ context: board })
		})
	}

	changeSection = (evt) => {
		var ed = {}
		ed[Item.DETAILS_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[Item.PEOPLE_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[Item.CONNECTIONS_PANEL_NAME] = evt.currentTarget.id === "openAll";
		if ((evt.currentTarget.id !== "openAll") && (evt.currentTarget.id !== "closeAll")) ed[evt.currentTarget.id] = true;
		this.setState(ed)
		evt.currentTarget.scrollIntoView({ block: 'end', inline: 'nearest' })

	}

	render() {
		var sectionHeaderType = "h5"
		var fieldHeaderType = "h6"
		if (this.props.card != null) {
			return (
				<Card variant='outlined' iid={this.state.data.id}>
					<Grid style={{ backgroundColor: this.state.data.type.cardColor }} container direction="row">
						<Grid item xs={2}>
						<CardActions style={{ backgroundColor: this.state.data.type.cardColor, justifyContent: 'center' }} >
						<Tooltip title="Open All">
								<IconButton id="openAll" sx={{ backgroundColor: '#fff', fontSize: '28px' }} aria-label='open panels' onClick={this.changeSection}>
									<KeyboardDoubleArrowDown />
								</IconButton>
							</Tooltip>
							<Tooltip title="Details">
								<IconButton id={Item.DETAILS_PANEL_NAME} sx={{ backgroundColor: '#fff', fontSize: '28px' }} aria-label='details panel' onClick={this.changeSection}>
									<List />
								</IconButton>
							</Tooltip>
							<Tooltip title="Connections">
								<IconButton id={Item.CONNECTIONS_PANEL_NAME} sx={{ backgroundColor: '#fff', fontSize: '28px' }} aria-label='details panel' onClick={this.changeSection}>
									<ConnectingAirports />
								</IconButton>
							</Tooltip>
							<Tooltip title="People">
								<IconButton id={Item.PEOPLE_PANEL_NAME} sx={{ backgroundColor: '#fff', fontSize: '28px' }} aria-label='details panel' onClick={this.changeSection}>
									<People />
								</IconButton>
							</Tooltip>
							<Tooltip title="Close All">
								<IconButton id="closeAll" sx={{ backgroundColor: '#fff', fontSize: '28px' }} aria-label='close panels' onClick={this.changeSection}>
									<KeyboardDoubleArrowUp />
								</IconButton>
							</Tooltip>
							
							</CardActions>
						</Grid>
						<Grid item xs={10}>
							<CardActions style={{ backgroundColor: this.state.data.type.cardColor, justifyContent: 'right' }} >
								<Tooltip title="Save Changes">
									<IconButton
										sx={{ backgroundColor: '#fff', fontSize: '28px' }}
										aria-label='save card'
										onClick={this.checkUpdates}
										color={this.isChanged ? 'error' : 'default'}
									>
										<SaveAltOutlined />
									</IconButton>
								</Tooltip>
								<Tooltip title={this.isChanged ? "Save and Close" : "Close"}>
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
						</Grid>
					</Grid>
					<CardContent sx={{ backgroundColor: this.state.data.type.cardColor }}>
						<Accordion expanded={this.state[Item.DETAILS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="details-content" id={Item.DETAILS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>{this.state[Item.DETAILS_PANEL_NAME] ? "Details for: " + this.state.data.id : this.state.data.title}</Typography>
							</AccordionSummary>
							<Grid container direction="column" >
								<Grid item>
									<Grid container direction="row">
										<Grid item margin={'10px'} className='card-description-field' >
											<Grid>
												<Paper elevation={0} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Title</Typography></Paper>
												<TextField

													variant="outlined"
													className='card-description-field'
													value={this.state.data.title}
													onBlur={this.updateTitle}
													onChange={this.titleChanged}
												/>
											</Grid>
										</Grid>
										<Grid item margin={'10px'} className='card-description-field' >
										<Paper elevation={0} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Status</Typography></Paper>
										</Grid>
									</Grid>
								</Grid>

								<Grid item margin={'10px'} className='card-description-field'>
									<Grid>
										<Paper elevation={0} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Description</Typography></Paper>
										<Editor
											onChange={this.descriptionChanged}
											value={this.state.data.description || ""}
											className='description'
											label="Description"
										/>
									</Grid>
								</Grid>

							</Grid>
						</Accordion>
						<Accordion expanded={this.state[Item.SCHEDULE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="schedule-content" id={Item.SCHEDULE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Schedule</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Planned Dates</Typography></Paper>
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Actual Dates</Typography></Paper>
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Time Box</Typography></Paper>
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[Item.CONNECTIONS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="connections-content" id={Item.CONNECTIONS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Connections</Typography>

							</AccordionSummary>
							<AccordionDetails>
								<ConnectionTable
									items={this.state.parents}
									title="Parents"
									titleType={fieldHeaderType}
								/>
								<ConnectionTable
									title="Descendants"
									titleType={fieldHeaderType}
									items={this.state.descendants}
								/>
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[Item.PEOPLE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="people-content" id={Item.PEOPLE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>People</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Assigned Users</Typography></Paper>
								<AssignedUserTable card={this.state.data} />
								<Paper square elevation={2} className="title-paper"><Typography variant={fieldHeaderType} className="title-field">Involved Users</Typography></Paper>
								<CardUserTable card={this.state.data} />
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