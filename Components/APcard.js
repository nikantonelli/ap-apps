import { BarChart, CalendarToday, CancelOutlined, CancelPresentation, Edit, ExpandMore, KeyboardDoubleArrowDown, KeyboardDoubleArrowUp, List, OpenInNew, People, SaveAltOutlined, SettingsEthernet } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActions, CardContent, Grid, IconButton, Paper, TextField, Tooltip, Typography } from "@mui/material";

import { find } from "lodash";
import React from "react";
import { getCard, updateCard } from "../Utils/Client/Sdk";
import { cardDescriptionFieldStyle, titleFieldStyle, titlePaperStyle } from "../styles/globals";
import { APBlocked } from "./AP-Fields/blocked";
import { APCustomIcon } from "./AP-Fields/customIcon";
import { APdateRange } from "./AP-Fields/dateRange";
import { APdescription } from "./AP-Fields/description";
import { APPriority } from "./AP-Fields/priority";
import { APSize } from "./AP-Fields/size";
import { APtags } from "./AP-Fields/tags";
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
	static FIELDNAMES = {
		PLANSTART: 'plannedStart',
		PLANEND: 'plannedFinish',
		TITLE: 'title',
		DESC: 'description'
	}

	constructor(props) {
		super(props);

		this.state = {
			data: props.card || null,
			description: props.card || props.card.description,
			context: props.context || null,
			contextIcons: null,
			openAll: true,
			loadSource: props.loadType || 'card',
			parents: [],
			isChanged: false
		}
		this.state[APCard.CONNECTIONS_PANEL_NAME] = false;
		this.state[APCard.PEOPLE_PANEL_NAME] = false;
		this.state[APCard.DETAILS_PANEL_NAME] = true;
		this.state[APCard.SCHEDULE_PANEL_NAME] = false;
		this.state[APCard.PROGRESS_PANEL_NAME] = false;

		this.outstandingChanges = [];	//All current 'changed' values of non-instant-update fields are held here
		this.savedData = { ...props.card };
	}

	getUpdates = () => {
		var changes = []
		this.outstandingChanges.forEach((change) => {
			switch (change.field) {
				case APCard.FIELDNAMES.DESC:
				case APCard.FIELDNAMES.TITLE:
				case APCard.FIELDNAMES.PLANEND:
				case APCard.FIELDNAMES.PLANSTART: {
					changes.push({ op: "replace", path: "/" + change.field, value: change.value })
					break;
				}
				default:
					break;
			}
		})
		return changes
	}

	checkUpdates = () => {
		if (this.outstandingChanges.length) {
			this.updateCard(JSON.stringify(this.getUpdates()))
			this.savedData = { ...this.state.data }
			this.outstandingChanges = [];
		}
	}

	closeAction = (e) => {
		if (this.props.onClose) this.props.onClose(e)
	}

	setData = (data) => {
		this.setState({ isChanged: true, data: data });
	}

	componentDidMount() {
		var me = this;
		var gc = this.props.card.parentCards.map((p) => getCard(this.props.host, p.cardId))
		if (gc.length) {
			Promise.all(gc).then((results) => {
				me.setState({ parents: results })
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
				var change = find(this.outstandingChanges, ['field', 'description'])
				if (change) change.value = data.description;
				else this.outstandingChanges.push({ field: 'description', value: data.description })
				this.setData(data)
			}
			this.dispatchDescClear = false
		}
	}

	titleChanged = (e) => {
		var data = { ...this.state.data };
		data.title = e.target.value.substr(0, 127);
		var change = find(this.outstandingChanges, ['field', 'title'])
		if (change) change.value = data.title;
		else this.outstandingChanges.push({ field: 'title', value: data.title })
		this.setData(data);
	}

	dateFormatter = (date) => {
		var retStr = date.toISOString()
		return retStr.substr(0, 10);
	}

	plannedStartChanged = (newValue) => {
		var data = { ...this.state.data };
		var date = new Date(newValue)
		data.plannedStart = this.dateFormatter(date)
		var change = find(this.outstandingChanges, ['field', APCard.FIELDNAMES.PLANSTART])
		if (change) change.value = data.plannedStart;
		else this.outstandingChanges.push({ field: APCard.FIELDNAMES.PLANSTART, value: data.plannedStart })
		this.setData(data)
	}

	plannedFinishChanged = (newValue) => {
		var data = { ...this.state.data };
		var date = new Date(newValue)
		data.plannedFinish = this.dateFormatter(date)
		var change = find(this.outstandingChanges, ['field', APCard.FIELDNAMES.PLANEND])
		if (change) change.value = data.plannedFinish;
		else this.outstandingChanges.push({ field: APCard.FIELDNAMES.PLANEND, value: data.plannedFinish })
		this.setData(data)
	}

	checkBeforeLeave = (e) => {
		if (this.state.isChanged) {
			SdkUtils.showError({ message: "Save/Cancel changes before leaving page" });
			e.preventDefault();
			e.returnValue = ''
		}
		window.removeEventListener('beforeunload', this.checkBeforeLeave);
	}

	cancelChanges = (e) => {

		this.dispatchDescClear = true;
		this.setState((prev) => {
			this.outstandingChanges = [];
			return { isChanged: false, data: { ...this.savedData } }
		})
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

	blockedUpdated = async (newValue) => {
		this.updateCard(
			JSON.stringify(
				[
					{
						op: "add",
						path: "/blockReason",
						value: "Blocked by User"
					},
					{
						op: "replace",
						path: "/isBlocked",
						value: newValue
					}
				]
			)
		)

	}

	sizeUpdated = async (value) => {
		this.updateCard(
			JSON.stringify(
				[
					{
						op: "replace",
						path: "/size",
						value: value
					}
				]
			)
		)
	}

	priorityUpdated = async (value) => {
		this.updateCard(
			JSON.stringify(
				[
					{
						op: "replace",
						path: "/priority",
						value: value
					}
				]
			)
		)

	}

	updateCard = async (bodyStr) => {
		if (!this.props.readOnly) {
			var newCard = await updateCard(this.props.host, this.props.card.id, bodyStr)
			this.setState({ data: newCard, isChanged: false })
		}
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

	editCard = () => {
		document.open("/nui/card/" + this.props.card.id, "", "noopener=true")
	}

	openCard = () => {
		document.open("/api/redirect/card/" + this.props.card.id, "", "noopener=true")
	}

	openBoard = () => {
		document.open("/api/redirect/board/" + this.props.card.board.id, "", "noopener=true")
	}

	scrollIntoView = (evt) => {
		if (evt.target.clientHeight) {
			evt.target.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" })
		}
	}

	render() {
		var sectionHeaderType = "h5"
		var fieldHeaderType = "h6"
		var card = this.state.data;
		var typeTitle = (this.state.loadSource === 'card') ? card.type.title : card.cardType.name
		var typeColour = (this.state.loadSource === 'card') ? card.type.cardColor : card.color
		if (this.state.data != null) {
			return (
				<Card className="card" sx={this.props.cardProps} variant='outlined' id={"card-" + card.id}>
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
								{card.connectedCardStats ?
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
												color={this.state.isChanged ? 'error' : 'default'}
											>
												<SaveAltOutlined />
											</IconButton>
										</Tooltip>
										<Tooltip title="Cancel Changes">
											<IconButton size='large' className="options-button-icon" aria-label='cancel changes' onClick={this.cancelChanges}>
												<CancelPresentation />
											</IconButton>
										</Tooltip>

									</>
									: <>
										<IconButton size='large' className="options-button-icon" onClick={this.editCard}>
											<Edit></Edit>
										</IconButton>
										<IconButton onClick={this.closeAction}>
											<CancelOutlined></CancelOutlined>
										</IconButton>
									</>
								}

							</CardActions>
						</Grid>
					</Grid>

					<CardContent sx={{ backgroundColor: typeColour }}>
						<Accordion expanded={this.state[APCard.DETAILS_PANEL_NAME]} onChange={this.handleAccordionChange} TransitionProps={{ onTransitionEnd: this.scrollIntoView }}>
							<AccordionSummary aria-controls="details-content" id={APCard.DETAILS_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>{this.state[APCard.DETAILS_PANEL_NAME] ? typeTitle + ": " + card.id : card.title}</Typography>
							</AccordionSummary>
							<Grid container direction="column" >
								<Grid item>
									<Grid container direction="row">
										<Grid item>
											<Grid container sx={cardDescriptionFieldStyle} >
												<Grid xs item>
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
												sx={cardDescriptionFieldStyle}
												InputProps={{
													readOnly: this.props.readOnly,
												}}
												variant="outlined"
												value={card.title}
												onChange={this.titleChanged}
											/>
										</Grid>
										<Grid item>
											<Grid container sx={cardDescriptionFieldStyle}>
												<Grid xs item>
													<Paper elevation={0} sx={titlePaperStyle}>
														<Typography variant={fieldHeaderType} sx={titleFieldStyle}>Context</Typography>
													</Paper>
												</Grid>
												<Grid item>
													<IconButton xs={2} onClick={this.openBoard}>
														<OpenInNew />
													</IconButton>
												</Grid>
											</Grid>
											<TextField
												InputProps={{
													readOnly: true,
												}}
												variant="outlined"
												sx={cardDescriptionFieldStyle}
												value={card.board.title}
											/>
										</Grid>
										<Grid item >
											<Grid container direction="column" sx={cardDescriptionFieldStyle}>
												<Grid item>
													<Paper elevation={0} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>
														{"Status: " + (Boolean(card.actualFinish) ?
															" Finished (" + card.actualFinish + ")" :
															Boolean(card.actualStart) ?
																" Started (" + card.actualStart + ")" :
																" Not Started"
														)}
													</Typography></Paper>
												</Grid>
												<Grid item>
													<Grid container direction="row" alignItems={"flex-end"}>
														<Grid xs={2} item>
															<APBlocked
																readOnly={this.props.readOnly}
																status={card.blockedStatus}
																updated={this.blockedUpdated}
															/>
														</Grid>
														<Grid xs={2} item>
															<APSize
																readOnly={this.props.readOnly}
																updated={this.sizeUpdated}
																size={card.size}
															/>
														</Grid>
														<Grid xs={2} item>
															<APPriority
																readOnly={this.props.readOnly}
																priority={card.priority}
																updated={this.priorityUpdated}
															/>
														</Grid>
														<Grid xs={2} item>
															<Grid container sx={{ alignItems: 'center' }} direction="column">
																{Boolean(card.customIcon) ? (
																	<APCustomIcon
																		host={this.props.host}
																		card={this.props.card}
																		readOnly={this.props.readOnly}
																	/>
																) : null}
															</Grid>
														</Grid>
													</Grid>
												</Grid>
											</Grid>
										</Grid>
										<Grid item  >
											<Grid container direction="column" sx={cardDescriptionFieldStyle}>
												<Grid item>
													<Paper elevation={0} sx={titlePaperStyle}>
														<Typography variant={fieldHeaderType} sx={titleFieldStyle}>
															Tags
														</Typography></Paper>
												</Grid>
												<Grid container direction="row">
													<Grid item>
														<APtags
															readOnly={this.props.readOnly}
															host={this.props.host}
															card={card}
														/>
													</Grid>
												</Grid>
											</Grid>
										</Grid>
									</Grid>
								</Grid>

								<Grid item sx={cardDescriptionFieldStyle}>
									<APdescription
										readOnly={this.props.readOnly}
										description={card.description}
										onChange={this.descriptionChanged}
										headerType={fieldHeaderType}
									/>
								</Grid>

							</Grid>
						</Accordion>
						{card.connectedCardStats ?
							<Accordion expanded={this.state[APCard.PROGRESS_PANEL_NAME]} onChange={this.handleAccordionChange} TransitionProps={{ onTransitionEnd: this.scrollIntoView }}>
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
													color={(!Boolean(card.plannedFinish) || !Boolean(card.plannedStart)) ? "error" : "text.primary"}
												>
													{"Percent Complete " + ((!Boolean(card.plannedFinish) || !Boolean(card.plannedStart)) ? "(Incomplete Planned Dates)" : "")}
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
						<Accordion expanded={this.state[APCard.SCHEDULE_PANEL_NAME]} onChange={this.handleAccordionChange} TransitionProps={{ onTransitionEnd: this.scrollIntoView }}>
							<AccordionSummary aria-controls="schedule-content" id={APCard.SCHEDULE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType} color={(Boolean(card.plannedStart) && Boolean(card.plannedFinish)) ? "text.primary" : "error"}>Schedule</Typography>
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
											start={card.plannedStart}
											end={card.plannedFinish}
											startChange={this.plannedStartChanged}
											endChange={this.plannedFinishChanged}
										/>
									</Grid>
									<Grid item sx={cardDescriptionFieldStyle} >
										<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Actual Dates</Typography></Paper>
										<APdateRange
											readOnly={true}
											start={card.actualStart}
											end={card.actualFinish}
										/>
									</Grid>
									<Grid item sx={cardDescriptionFieldStyle} >
										<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Time Box</Typography></Paper>
									</Grid>
								</Grid>
							</AccordionDetails>
						</Accordion>
						<Accordion expanded={this.state[APCard.CONNECTIONS_PANEL_NAME]} onChange={this.handleAccordionChange} TransitionProps={{ onTransitionEnd: this.scrollIntoView }}>
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
						<Accordion expanded={this.state[APCard.PEOPLE_PANEL_NAME]} onChange={this.handleAccordionChange} TransitionProps={{ onTransitionEnd: this.scrollIntoView }}>
							<AccordionSummary aria-controls="people-content" id={APCard.PEOPLE_PANEL_NAME} expandIcon={<ExpandMore />}>
								<Typography variant={sectionHeaderType}>People</Typography>
							</AccordionSummary>
							<AccordionDetails>
								<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Assigned Users</Typography></Paper>
								<AssignedUserTable host={this.props.host} card={this.state.data} />
								<Paper square elevation={2} sx={titlePaperStyle}><Typography variant={fieldHeaderType} sx={titleFieldStyle}>Involved Users</Typography></Paper>
								<CardUserTable host={this.props.host} card={this.state.data} />
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