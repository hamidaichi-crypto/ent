// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button' // Import Button
import type { SelectChangeEvent } from '@mui/material/Select'

// Type Imports
import type { WithdrawalType } from '@/types/apps/withdrawalTypes'

type Filters = {
    status: string[]
    startDate: string
    endDate: string
}

// Define props type including onSearch
type TableFiltersProps = {
    filters: Filters
    onFilterChange: (newFilters: Filters) => void
    onSearch: () => void // Add onSearch prop
}

const TableFilters = ({ filters, onFilterChange, onSearch }: TableFiltersProps) => {
    const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
        const newStatus = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
        onFilterChange({ ...filters, status: newStatus })
    }

    const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, startDate: event.target.value })
    }

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, endDate: event.target.value })
    }

    return (
        <CardContent>
            <Grid container spacing={5}>
                <Grid>
                    <FormControl fullWidth>
                        <InputLabel id='status-select'>Select Status</InputLabel>
                        <Select
                            multiple
                            fullWidth
                            id='select-status'
                            value={filters.status}
                            onChange={handleStatusChange}
                            label='Select Status'
                            labelId='status-select'
                            inputProps={{ placeholder: 'Select Status' }}
                        >
                            <MenuItem value='PENDING'>Pending</MenuItem>
                            <MenuItem value='APPROVED'>Approved</MenuItem>
                            <MenuItem value='REJECTED'>Rejected</MenuItem>
                            <MenuItem value='IN_PROGRESS'>In Progress</MenuItem>
                            <MenuItem value='RISKY'>Risky</MenuItem>
                            <MenuItem value='INCOMPLETE_PAYOUT'>Incomplete Payout</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid>
                    <TextField
                        fullWidth
                        label='Start Date'
                        type='date'
                        value={filters.startDate}
                        onChange={handleStartDateChange}
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Grid>
                <Grid>
                    <TextField
                        fullWidth
                        label='End Date'
                        type='date'
                        value={filters.endDate}
                        onChange={handleEndDateChange}
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Grid>
                {/* Add Search Button */}
                <Grid sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant='contained' onClick={onSearch}>
                        Search
                    </Button>
                </Grid>
            </Grid>
        </CardContent>
    )
}

export default TableFilters
