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
// import type { UsersType } from '@/types/apps/userTypes'
import { MemberType } from '@/types/apps/memberTypes'

type Filters = {
    username: string,
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

    const handleStatusChange = (event: SelectChangeEvent<string>) => {
        onFilterChange({ ...filters, dateType: event.target.value })
    }

    const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, startDate: event.target.value })
    }

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, endDate: event.target.value })
    }

    // New handlers for username and name text fields
    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, username: event.target.value })
    }

    return (
        <CardContent>
            <Grid container spacing={5}>
                {/* Username Text Field */}
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        fullWidth
                        label='Username'
                        value={filters.username}
                        onChange={handleUsernameChange}
                        placeholder='Enter Username'
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Grid>
                {/* Name Text Field */}
                <Grid size={{ xs: 12, sm: 4 }}>
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
                <Grid size={{ xs: 12, sm: 4 }}>
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
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant='contained' onClick={onSearch}>
                        Search
                    </Button>
                </Grid>
            </Grid>
        </CardContent>
    )
}

export default TableFilters
