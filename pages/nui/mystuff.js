import { Card, CardActions, CardHeader, Grid, IconButton, InputAdornment, Paper, Stack, TextField, Tooltip } from "@mui/material";

import { AccountTree, Cancel, NextPlan, Search, Settings, SkipPrevious } from "@mui/icons-material";
import { orderBy } from "lodash";
import { useState } from 'react';
import { ConfigDrawer } from "../../Components/ConfigDrawer";
import { findBoards } from "../../Utils/Client/Sdk";
import { extractOpts } from "../../Utils/Server/Helpers";
import UserService from "../../Services/UserService";

export default function Board({ host, assigned, subscribed, grouping, field, dir }) {

	const home = "/nui/mystuff";

	const [cards, setCards] = useState([
		{
			assigned: assigned || [],
			subscribed: subscribed || []
		}
	]);

	const [filterText, setFilterText] = useState("");
	const [pending, setPending] = useState(false);
	const [sortField, setLSortField] = useState(field || "id")
	const [lSortDir, setLSortDir] = useState(dir || "ascending")
	const [lGrouping, setLGrouping] = useState(grouping || 'none')
	const [lSortType, setLSortType] = useState('id')
	const [drawerOpen, setDrawerOpen] = useState(false)

	function cardClicked(evt) {
		document.open("/nui/card/" + evt.currentTarget.id, "", "noopener=true")
	}

	function updateList() {
		var fld = document.getElementById("filter-field");
		setFilterText(fld.value);
		setPending(false);
	}

	function sortCards(cards) {
		var sortedCards = orderBy(cards, [sortField], [lSortDir])
		return sortedCards;
	}

	async function getList(fltr) {
		if (fltr && (fltr.length == 0)) fltr = null;
		var result = await findBoards(host, { search: fltr });
		if (result) {
			var sortedBoards = sortCards(result.boards)
			setCards(sortedBoards);
		}
	}


	function clearFilter() {
		var fltrField = document.getElementById("filter-field")
		fltrField.value = "";
		setFilterText("")
		setPending(false);
	}

	function closeDrawer() {
		setDrawerOpen(false)
	}
	function openDrawer() {
		setDrawerOpen(true)
	}

	function errorChange(evt) {
		setPending(false);
		setLShowErrors(evt.target.value)
	}
	function groupChange(evt) {
		setPending(false);
		setLGrouping(evt.target.value)
	}
	function colourChange(evt) {
		setPending(false);
		setLColouring(evt.target.value)
	}
	function sortDirChange(evt) {
		setPending(false);
		setLSortDir(evt.target.value)
	}
	function sortChange(evt) {
		setPending(false);
		setLSortType(evt.target.value)
	}

	function fieldChange(evt) {
		setPending(false);
		setLSortField(evt.target.value)
	}
	return <Stack>
		<Paper>
			<>
				<Tooltip title="View Settings">
					<IconButton sx={{ margin: "0px 10px 0px 10px" }} onClick={openDrawer}>
						<Settings />
					</IconButton>
				</Tooltip>
				<ConfigDrawer
					onClose={closeDrawer}
					width={200}
					open={drawerOpen}
					field={sortField}
					fieldChange={fieldChange}
					sortDir={lSortDir}
					sortDirChange={sortDirChange}
					icons={
						[
							{
								icon: <SkipPrevious />,
								url: home
							}
						]
					}
				/>
			</>
			<Tooltip title="Type, then click on Magnifying Glass">
				<TextField
					id="filter-field"
					variant="standard"
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								{filterText.length != 0 ?
									<IconButton onClick={clearFilter} sx={{ cursor: 'pointer' }}>
										<Cancel />
									</IconButton>
									: null}
								<Search onClick={updateList} sx={{ cursor: 'pointer' }} />
							</InputAdornment>
						),
					}}
				/>
			</Tooltip>
		</Paper>

	</Stack>

}

export async function getServerSideProps({ req, query }) {

	var appProps = { host: req.headers.host }
	var us = new UserService(req.headers.host);
	extractOpts(query, appProps)
	var me = await us.getMe()
	appProps.me = me;
	var as = await us.getMyAssignedCards()
	appProps.assigned = as;
	var ss = await us.getMySubscribedCards()
	appProps.subscribed = ss;

	//Find the url to this server and pass to client-side
	return { props: appProps };
}