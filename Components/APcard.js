import { BarChart, CalendarToday, CancelOutlined, CancelPresentation, Delete, DeleteForever, ExpandMore, KeyboardDoubleArrowDown, KeyboardDoubleArrowUp, List, Logout, OpenInNew, People, SaveAltOutlined, SettingsEthernet } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActions, CardContent, Grid, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";

import React from "react";
import { cardDescriptionFieldStyle, titleFieldStyle, titlePaperStyle } from "../styles/globals";
import { getCard } from "../Utils/Client/Sdk";
import { APBlocked } from "./AP-Fields/blocked";
import { APdateRange } from "./AP-Fields/dateRange";
import { APdescription } from "./AP-Fields/description";
import { APPriority } from "./AP-Fields/priority";
import { APSize } from "./AP-Fields/size";
import { AssignedUserTable } from "./AssignedUserTable";
import { CardUserTable } from "./CardUserTable";
import { APChildStats } from "./ChildStats";
import { ConnectionTable } from "./ConnectionTable";


export class APCard extends React.Component {

	static CONNECTIONS_PANEL_NAME = "connectionsSection";
	static PEOPLE_PANEL_NAME = "peopleSection";
	static DETAILS_PANEL_NAME = "detailsSection";
	static SCHEDULE_PANEL_NAME = "scheduleSection"
	static PROGRESS_PANEL_NAME = "progressSection"

	constructor(props) {
		super(props);

		this.state = {
			data: props.card || null,
			description: props.card || props.card.description,
			changed: false,
			context: props.context || null,
			contextIcons: null,
			openAll: true,
			blocked: props.card || props.card.blockedStatus.isBlocked,
			loadSource: props.loadType || 'card',
			parents: []
		}
		this.state[APCard.CONNECTIONS_PANEL_NAME] = false;
		this.state[APCard.PEOPLE_PANEL_NAME] = false;
		this.state[APCard.DETAILS_PANEL_NAME] = true;
		this.state[APCard.SCHEDULE_PANEL_NAME] = false;
		this.state[APCard.PROGRESS_PANEL_NAME] = false;

		this.savedData = props.card;
	}

	closeAction = (e) => {
		if (this.props.onClose) this.props.onClose(e)
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

	componentDidMount() {
		var me = this;
		var gc = this.props.card.parentCards.map((p) => getCard(this.props.host, p.cardId))
		if (gc.length) {
			Promise.all(gc).then((results) => {
				me.setState({ parents : results})
			})
		}
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

	cleanIconPath = (path) => {
		var pos = path.search("/customicon")
		var newPath = "/api" + path.substr(pos);
		return newPath
	}

	handleAccordionChange = (event, requestedState) => {
		var ed = {};
		ed[event.currentTarget.id] = requestedState;
		this.setState(ed);
	}

	toggleBlocked = (evt) => {

		if (!this.props.readOnly) this.setState((prev) => { return { blocked: !prev.blocked } })
	}

	changeSection = (evt) => {
		var ed = {}

		ed[APCard.DETAILS_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APCard.PEOPLE_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APCard.CONNECTIONS_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APCard.SCHEDULE_PANEL_NAME] = evt.currentTarget.id === "openAll";
		ed[APCard.PROGRESS_PANEL_NAME] = evt.currentTarget.id === "openAll";

		if ((evt.currentTarget.id !== "openAll") && (evt.currentTarget.id !== "closeAll")) {
			ed[evt.currentTarget.id] = true;
		}
		this.setState(ed)
		evt.currentTarget.scrollIntoView({ block: 'end', inline: 'nearest' })


	}

	openCard = () => {
		document.open("/api/redirect/card/" + this.props.card.id, "", "noopener=true")
	}

	openBoard = () => {
		document.open("/api/redirect/board/" + this.props.card.board.id, "", "noopener=true")
	}

	render() {
		var sectionHeaderType = "h5"
		var fieldHeaderType = "h6"

		var typeTitle = (this.state.loadSource === 'card') ? this.state.data.type.title : this.state.data.cardType.name
		var typeColour = (this.state.loadSource === 'card') ? this.state.data.type.cardColor : this.state.data.color
		if (this.state.data != null) {
			return (
				<Card className="card" sx={this.props.cardProps} variant='outlined' id={"card-" + this.state.data.id}>
					<Grid style={{ backgroundColor: typeColour }} container direction="row">
						<Grid item xs={6}>
							<CardActions style={{ backgroundColor: typeColour, justifyContent: 'left' }} >
								<Tooltip title="Open All">
									<IconButton id="openAll" size='large' className="options-button-icon" aria-label='open panels' onClick={this.changeSection}>
										<KeyboardDoubleArrowDown />
									</IconButton>
								</Tooltip>
								<Tooltip title="Details">
									<IconButton id={APCard.DETAILS_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<List />
									</IconButton>
								</Tooltip>
								{this.state.data.connectedCardStats ?
									<Tooltip title="Child Progress">
										<IconButton id={APCard.PROGRESS_PANEL_NAME} size='large' className="options-button-icon" aria-label='progress panel' onClick={this.changeSection}>
											<BarChart />
										</IconButton>
									</Tooltip>
									: null}
								<Tooltip title="Schedule">
									<IconButton id={APCard.SCHEDULE_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<CalendarToday />
									</IconButton>
								</Tooltip>
								<Tooltip title="Connections">
									<IconButton id={APCard.CONNECTIONS_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<SettingsEthernet />
									</IconButton>
								</Tooltip>
								<Tooltip title="People">
									<IconButton id={APCard.PEOPLE_PANEL_NAME} size='large' className="options-button-icon" aria-label='details panel' onClick={this.changeSection}>
										<People />
									</IconButton>
								</Tooltip>
								<Tooltip title="Close All">
									<IconButton id="closeAll" size='large' className="options-button-icon" aria-label='close panels' onClick={this.changeSection}>
										<KeyboardDoubleArrowUp />
									</IconButton>
								</Tooltip>
							</CardActions>
						</Grid>
						<Grid item xs={6}>
							<CardActions style={{ backgroundColor: typeColour, justifyContent: 'right' }} >

								{!this.props.readOnly ?
									<>
										<Tooltip title="Save Changes">
											<IconButton
												size='large'
												className="options-button-icon"
												aria-label='save card'
												onClick={this.checkUpdates}
												color={this.isChanged ? 'error' : 'default'}
											>
												<SaveAltOutlined />
											</IconButton>
										</Tooltip>
										<Tooltip title={this.isChanged ? "Save and Close" : "Close"}>
											<IconButton
												size='large'
												className="options-button-icon"
												aria-label='save if needed, and close'
												onClick={this.updateDataClose}
												color={this.isChanged ? 'error' : 'default'}
											>
												<Logout />
											</IconButton>
										</Tooltip>
										<Tooltip title="Cancel Changes">
											<IconButton size='large' className="options-button-icon" aria-label='cancel changes' onClick={this.cancelChanges}>
												<CancelPresentation />
											</IconButton>
										</Tooltip>

										<Tooltip title="Send to Recycle Bin">
											<IconButton size='large' className="options-button-icon" aria-label="send to recycle bin" onClick={this.deleteRecycle}>
												<Delete />
											</IconButton>
										</Tooltip>

										<Tooltip title="Delete Forever">
											<IconButton size='large' className="options-button-icon" aria-label="delete forever" onClick={this.deleteForever} >
												<DeleteForever />
											</IconButton>
										</Tooltip>
									</>
									: <IconButton onClick={this.closeAction}>
										<CancelOutlined></CancelOutlined>
									</IconButton>}
							</CardActions>
						</Grid>
					</Grid>

					<CardContent sx={{ backgroundColor: typeColour }}>
						<Accordion expanded={this.state[APCard.DETAILS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="details-content" id={APCard.DETAILS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>{this.state[APCard.DETAILS_PANEL_NAME] ? typeTitle + ": " + this.state.data.id : this.state.data.title}</Typography>
							</AccordionSummary>
							<Grid container direction="column" >
								<Grid item>
									<Grid container direction="row">
										<Grid item sx={cardDescriptionFieldStyle} >
											<Grid container>
												<Grid item>
													<Paper elevation={0} sx={titlePaperStyle}>
														<Typography variant={fieldHeaderType} sx={titleFieldStyle}>Title</Typography>
													</Paper>
												</Grid>
												<Grid item>
													<IconButton xs={2} onClick={this.openCard}>
														<OpenInNew />
													</IconButton>
												</Grid>
											</Grid>
											<TextField
												sx={{ width: "100%" }}
												variant="outlined"
												className='card-description-field'
												value={this.state.data.title}
												onBlur={this.updateTitle}
												onChange={this.titleChanged}
											/>
										</Grid>
										<Grid item sx={cardDescriptionFieldStyle} >
											<Grid container>
												<Grid item>
													<Paper elevation={0} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Context</Typography></Paper>
												</Grid>
												<Grid item>
													<IconButton onClick={this.openBoard}>
														<OpenInNew />
													</IconButton>
												</Grid>
											</Grid>
											<TextField
												InputProps={{
													readOnly: true,
												}}
												variant="outlined"
												sx={{ width: "100%" }}
												value={this.state.data.board.title}
											/>
										</Grid>
										<Grid item sx={cardDescriptionFieldStyle} >
											<Paper elevation={0} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>
												{"Status: " + ((this.state.data.lane.cardStatus === "finished") ?
													" Finished (" + this.state.data.actualFinish + ")" :
													(this.state.data.lane.cardStatus === "notStarted") ?
														" Not Started" :
														" Started (" + this.state.data.actualStart + ")"
												)}
											</Typography></Paper>
											<Grid container direction="row">
												<Grid xs={2} item>
													<APBlocked
														status={this.state.data.blockedStatus}
														toggleBlocked={this.toggleBlocked}
													/>
												</Grid>
												<Grid xs={2} item>
													<APSize
														size={this.state.data.size}
													/>
												</Grid>
												<Grid xs={2} item>
													<APPriority
														priority={this.state.data.priority}
													/>
												</Grid>
												<Grid xs={2} item>
													<Grid container sx={{ alignItems: 'center' }} direction="column">
														{Boolean(this.state.data.customIcon) ? (
															<>
																<Grid item sx={{ margin: "0px" }}>
																	<img style={{ width: "28px", height: "28px" }} alt={this.state.data.customIcon.name} src={this.cleanIconPath(this.state.data.customIcon.iconPath)} />
																</Grid>
																<Grid item>
																	<Paper elevation={0}>{this.state.data.customIcon.title}</Paper>
																</Grid>
															</>
														) : null}
													</Grid>
												</Grid>
											</Grid>
										</Grid>
									</Grid>
								</Grid>

								<Grid item sx={cardDescriptionFieldStyle}>
									<APdescription
										description={this.state.data.description}
										onChange={this.descriptionChanged}
										headerType={fieldHeaderType}
									/>
								</Grid>

							</Grid>
						</Accordion>
						{this.state.data.connectedCardStats ?
							<Accordion expanded={this.state[APCard.PROGRESS_PANEL_NAME]} onChange={this.handleAccordionChange}>
								<AccordionSummary aria-controls="progress-content" id={APCard.PROGRESS_PANEL_NAME} expandIcon={<ExpandMore />}>
									<Typography variant={sectionHeaderType}>Child Progress</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Grid container direction="row">
										<Grid item sx={cardDescriptionFieldStyle} >
											<Paper square elevation={2} sx={titlePaperStyle}>
												<Typography
													variant={fieldHeaderType}
													sx={titleFieldStyle}
													color={(!Boolean(this.state.data.plannedFinish) || !Boolean(this.state.data.plannedStart)) ? "error" : "text.primary"}
												>
													{"Percent Complete " + ((!Boolean(this.state.data.plannedFinish) || !Boolean(this.state.data.plannedStart)) ? "(Incomplete Planned Dates)" : "")}
												</Typography>
											</Paper>
											<APChildStats
												data={this.state.data}
												showByPoints
												showByCount
												showProgress
												circleSize={80}
											/>
										</Grid>
									</Grid>
								</AccordionDetails>
							</Accordion>
							: null}
						<Accordion expanded={this.state[APCard.SCHEDULE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="schedule-content" id={APCard.SCHEDULE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType} color={(Boolean(this.state.data.plannedStart) && Boolean(this.state.data.plannedFinish)) ? "text.primary" : "error"}>Schedule</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Grid container direction="row">
									<Grid item sx={cardDescriptionFieldStyle}>
										<Paper square elevation={2} sx={titlePaperStyle}>
											<Typography variant={fieldHeaderType} sx={titleFieldStyle}>
												Planned Dates
											</Typography>
										</Paper>
										<APdateRange
											start={this.state.data.plannedStart}
											end={this.state.data.plannedFinish}
										/>
									</Grid>
									<Grid item sx={cardDescriptionFieldStyle} >
										<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Actual Dates</Typography></Paper>
										<APdateRange
											start={this.state.data.actualStart}
											end={this.state.data.actualFinish}
										/>
									</Grid>
									<Grid itemsx={cardDescriptionFieldStyle} >
										<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Time Box</Typography></Paper>
									</Grid>
								</Grid>
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[APCard.CONNECTIONS_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="connections-content" id={APCard.CONNECTIONS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>Connections</Typography>

							</AccordionSummary>
							<AccordionDetails>
								{this.state.parents?.length ?
									<ConnectionTable
										items={this.state.parents}
										title="Parents"
										titleType={fieldHeaderType}
									/> : null}
								{this.props.descendants?.length ?
									<ConnectionTable
										title="Descendants"
										titleType={fieldHeaderType}
										items={this.props.descendants}
									/> : null}
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[APCard.PEOPLE_PANEL_NAME]} onChange={this.handleAccordionChange}>
							<AccordionSummary aria-controls="people-content" id={APCard.PEOPLE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>People</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Assigned Users</Typography></Paper>
								<AssignedUserTable card={this.state.data} />
								<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Involved Users</Typography></Paper>
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