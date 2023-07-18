import { PlaylistRemove } from "@mui/icons-material";
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import React from "react";
import { shortDate } from "../utils/Client/Helpers";

export class CardUserTable extends React.Component {

    sendEmail = (evt) => {
        var doc = document.open("mailto:" + evt.currentTarget.id + '?subject=Assigned User',"", 'noopener=true')
    }
    render = () => {
        var users = [];

        users.push({ type: "Last Edit", user: this.props.card.updatedBy, date: Boolean(this.props.card.updatedOn) ? new Date(this.props.card.updatedOn).toString() : null })
        users.push({ type: "Last Move", user: this.props.card.movedBy, date: Boolean(this.props.card.movedOn) ? new Date(this.props.card.movedOn).toString() : null })
        users.push({ type: "Create", user: this.props.card.createdBy, date: Boolean(this.props.card.createdOn) ? new Date(this.props.card.createdOn).toString() : null })
        users.push({ type: "Archive", user: this.props.card.archivedBy, date: Boolean(this.props.card.archivedOn) ? new Date(this.props.card.archivedOn).toString() : null })
        return (
            <TableContainer sx={{ maxHeight: 400 }} component={Box}>
                <Table stickyHeader sx={{ minWidth: 500 }} size="small" aria-label="Assigned User table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Action</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Full Name</TableCell>
                            <TableCell>User Name</TableCell>
                            <TableCell>Avatar</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((row, idx) => {
                            return Boolean(row.user)?
                            <TableRow
                                key={idx}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {row.type}
                                </TableCell>
                                <TableCell>{Boolean(row.date) ? shortDate(row.date) : null}</TableCell>
                                <TableCell>{Boolean(row.user) ? row.user.fullName : null}</TableCell>
                                {Boolean(row.user.emailAddress) ?
                                    <TableCell sx={{email:row.user.emailAddress}} className="clickable" onClick={this.sendEmail}>{Boolean(row.user) ? row.user.emailAddress : null}</TableCell> :
                                    <TableCell />}
                                <TableCell>{Boolean(row.user) ? <img alt={"User Avatar"} src={row.user.avatar} /> : null}</TableCell>
                            </TableRow>
                            :null    
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }
}