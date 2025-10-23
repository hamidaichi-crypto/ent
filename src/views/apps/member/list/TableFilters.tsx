// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button' // Import Button
import type { SelectChangeEvent } from '@mui/material/Select'

// Type Imports
// import type { UsersType } from '@/types/apps/userTypes'
import { MemberType } from '@/types/apps/memberTypes'

type Filters = {
    username: string,
    name: string,
    mobile: string,
    dateType: string,
    startDate: string
    endDate: string
}

// Define props type including onSearch
type TableFiltersProps = {
    filters: Filters
    onFilterChange: (newFilters: Filters) => void
    onClear: () => void
    onSearch: () => void // Add onSearch prop
}

const TableFilters = ({ filters, onFilterChange, onClear, onSearch }: TableFiltersProps) => {

    const handleStatusChange = (event: SelectChangeEvent<string>) => {
        onFilterChange({ ...filters, dateType: event.target.value })
    }

    const handleClearDateType = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent the select dropdown from opening
        onFilterChange({ ...filters, dateType: '' })
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

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, name: event.target.value })
    }

    const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, mobile: event.target.value })
    }



    // States
    //   const [role, setRole] = useState<MemberType['role']>('')
    //   const [plan, setPlan] = useState<MemberType['currentPlan']>('')
    // const [status, setStatus] = useState<MemberType['status']>(0)


    // useEffect(() => {
    //     const filteredData = tableData?.filter(member => {
    //         console.log("member")
    //         //   if (role && user.role !== role) return false
    //         //   if (plan && user.currentPlan !== plan) return false
    //         //   if (status && member.status !== status) return false

    //         return true
    //     })

    //     setData(filteredData || [])
    // }, [tableData, setData])

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
                        label='Name'
                        value={filters.name}
                        onChange={handleNameChange}
                        placeholder='Enter Name'
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        fullWidth
                        label='Mobile'
                        value={filters.mobile}
                        onChange={handleMobileChange}
                        placeholder='Enter Mobile'
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth>
                        <InputLabel id='status-select'>Select Status</InputLabel>
                        <Select
                            fullWidth
                            id='select-status'
                            value={filters.dateType}
                            onChange={handleStatusChange}
                            label='Select Status'
                            labelId='status-select'
                            endAdornment={
                                filters.dateType && (
                                    <IconButton
                                        size='small'
                                        onClick={handleClearDateType}
                                        sx={{ position: 'absolute', right: '2rem' }}
                                    >
                                        <i className='ri-close-line' />
                                    </IconButton>
                                )
                            }
                            inputProps={{ placeholder: 'Select Status' }}
                        >
                            <MenuItem value=''><em>None</em></MenuItem>
                            <MenuItem value='registration_date'>Registration Date</MenuItem>
                            <MenuItem value='last_login_date'>Last Login Date</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
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
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant='contained' onClick={onSearch}>
                        Search
                    </Button>
                    <Button variant='outlined' color='secondary' onClick={onClear}>
                        Clear
                    </Button>
                </Grid>
            </Grid>
        </CardContent>
    )
}

export default TableFilters
