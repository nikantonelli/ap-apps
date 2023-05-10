import { PlaylistRemove } from "@mui/icons-material";
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import React from "react";

export class AssignedUserTable extends React.Component {

    sendEmail = (evt) => {
        var row = JSON.parse(evt.currentTarget.getAttribute('value'))
        document.open("mailto:" + row.emailAddress, "", 'noopener=true')

    }
    render = () => {

        return (
            <TableContainer sx={{ maxHeight: 400 }} component={Box}>
                <Table stickyHeader sx={{ minWidth: 500 }} size="small" aria-label="Assigned User table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Full Name</TableCell>
                            <TableCell>User Name</TableCell>
                            <TableCell>Avatar</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.props.card.assignedUsers.map((row, idx) => (
                            <TableRow
                                key={idx}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {row.fullName}
                                </TableCell>
                                {Boolean(row.emailAddress) ?
                                    <Tooltip title="mailto:" placement="bottom-start">
                                        <TableCell value={JSON.stringify(row)} className="clickable" onClick={this.sendEmail}>{Boolean(row.emailAddress) ? row.emailAddress : null}
                                        </TableCell>
                                    </Tooltip> :
                                    <TableCell />}
                                <TableCell>
                                    {Boolean(row.avatar) ? <img style={{ width: "25px", height: "25px" }} src={row.avatar} /> : null}
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }
}