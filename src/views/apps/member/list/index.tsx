'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Type Imports
import type { MemberType } from '@/types/apps/memberTypes'

// Component Imports
import MemberListTable from './MemberListTable'

// Utils Imports
import { useFetchData } from '@/utils/api'

const MemberList = () => {
    // States
    const [memberData, setMemberData] = useState<MemberType[] | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [paginationData, setPaginationData] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 30,
        total: 0
    })


    // Calculate default dates
    const today = new Date()
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(today.getDate() - 14)

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')

        return `${year}-${month}-${day}`
    }

    const defaultStartDate = formatDate(twoWeeksAgo)
    const defaultEndDate = formatDate(today)

    const [filters, setFilters] = useState<{
        username: string,
        name: string,
        mobile: string,
        dateType: string,
        startDate: string
        endDate: string
    }>({
        username: '',
        name: '',
        mobile: '',
        dateType: 'registration_date',
        startDate: defaultStartDate, // Set default start date
        endDate: defaultEndDate // Set default end date
    })

    // State to trigger data fetch
    const [triggerFetch, setTriggerFetch] = useState(false)

    // Hooks
    const fetchData = useFetchData()

    const fetchMemberData = async (page: number, perPage: number, currentFilters: typeof filters) => {
        try {
            setLoading(true)

            let queryString = `/members?page=${page}&per_page=${perPage}`

            if (currentFilters.username) {
                queryString += `&user_name=${currentFilters.username}`
            }
            if (currentFilters.name) {
                queryString += `&name=${currentFilters.name}`
            }
            if (currentFilters.mobile) {
                queryString += `&mobile=${currentFilters.mobile}`
            }

            if (currentFilters.dateType) {
                queryString += `&date_type=${currentFilters.dateType}`
            }
            if (currentFilters.startDate) {
                queryString += `&start_date=${currentFilters.startDate}`
            }
            if (currentFilters.endDate) {
                queryString += `&end_date=${currentFilters.endDate}`
            }



            const data = await fetchData(queryString)
            setMemberData(data?.data?.rows)
            setPaginationData(data?.data?.paginations)
        } catch (error) {
            console.error('Failed to fetch member data:', error)
            setMemberData([]) // Set to empty array on error
            setPaginationData({ current_page: 1, last_page: 1, per_page: 30, total: 0 })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (triggerFetch) {
            fetchMemberData(paginationData.current_page, paginationData.per_page, filters)
            setTriggerFetch(false) // Reset trigger after fetch
        }
    }, [triggerFetch, paginationData.current_page, paginationData.per_page, filters]) // Dependencies for fetch

    // Initial fetch on component mount
    useEffect(() => {
        // Trigger initial fetch with default filters
        setTriggerFetch(true)
    }, [])


    const handlePageChange = (newPage: number) => {
        fetchMemberData(newPage, paginationData.per_page, filters)
    }

    const handleRowsPerPageChange = (newPerPage: number) => {
        fetchMemberData(1, newPerPage, filters) // Reset to first page when rows per page changes
    }

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters)
        setPaginationData(prev => ({ ...prev, current_page: 1 })) // Reset to first page on filter change
    }

    // Handler for the search button
    const handleSearch = () => {
        setTriggerFetch(true)
        setPaginationData(prev => ({ ...prev, current_page: 1 })) // Reset to first page on search
    }

    if (loading) {
        return (
            <Box className='flex justify-center items-center min-bs-[200px]'>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
                <MemberListTable
                    tableData={memberData}
                    paginationData={paginationData}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearch} // Pass handleSearch to WithdrawalListTable
                />
            </Grid>
        </Grid>
    )
}

export default MemberList
